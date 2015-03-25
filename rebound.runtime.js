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
      this.template = typeof this.template === "object" ? hydrate(this.template) : this.template;


      // Render our dom and place the dom in our custom element
      // Template accepts [data, options, contextualElement]
      this.el.appendChild(this.template(this, { helpers: this.helpers }, this.el));

      // Add active class to this newly rendered template's link elements that require it
      $(this.el).markLinks();

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
    return str.indexOf("<script>") > -1 && str.indexOf("</script>") > -1 ? "(function(){" + str.replace(/([^]*<script>)([^]*)(<\/script>[^]*)/ig, "$2") + "})()" : "{}";
  }

  // Remove the contents of the component's `style` tag.
  function getStyle(str) {
    return str.indexOf("<style>") > -1 && str.indexOf("</style>") > -1 ? str.replace(/([^]*<style>)([^]*)(<\/style>[^]*)/ig, "$2").replace(/"/g, "\\\"") : "";
  }

  // Remove the contents of the component's `template` tag.
  function getTemplate(str) {
    return str.replace(/[^]*<template>([^]*)<\/template>[^]*/gi, "$1").replace(/([^]*)<style>[^]*<\/style>([^]*)/ig, "$1$2");
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

    if (!isGlobal) {
      window.Rebound.services.page = (this.current = pageInstance).__component__;
    } else {
      window.Rebound.services[pageInstance.__name] = pageInstance.__component__;
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
          if (path !== "/" + Backbone.history.fragment) $(document).unMarkLinks();
          router.navigate(path, { trigger: true });
        }
      });

      Backbone.history.on("route", function (route, params) {
        $(document).markLinks();
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
      return env.helpers.__callOnComponent(callback, event);
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
      debugger;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByb3BlcnR5LWNvbXBpbGVyL3Byb3BlcnR5LWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21waWxlci9yZWJvdW5kLWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50LmpzIiwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb24uanMiLCJyZWJvdW5kLXByZWNvbXBpbGVyL3JlYm91bmQtcHJlY29tcGlsZXIuanMiLCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlci5qcyIsInJ1bnRpbWUuanMiLCJwcm9wZXJ0eS1jb21waWxlci90b2tlbml6ZXIuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzLmpzIiwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5LmpzIiwicmVib3VuZC1jb21wb25lbnQvaG9va3MuanMiLCJyZWJvdW5kLWRhdGEvbW9kZWwuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlLmpzIiwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YS5qcyIsInJlYm91bmQtY29tcG9uZW50L3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztNQUdPLFNBQVM7O0FBRWhCLE1BQUksa0JBQWtCLEdBQUcsRUFBRSxDQUFDOzs7O0FBSTVCLFdBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUIsUUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOztBQUVoQixRQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDOztBQUV2QyxRQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFOztBQUNyQixhQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDbkMsTUFBTSxHQUFHLEVBQUU7UUFDWCxLQUFLO1FBQ0wsYUFBYSxHQUFHLEVBQUU7UUFDbEIsVUFBVSxHQUFHLEVBQUU7UUFDZixPQUFPLEdBQUcsRUFBRTtRQUNaLEtB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LEdBQUcsR0FBRyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ3JGLE1BQUksUUFBUSxHQUFHLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztNQUFFLFNBQVMsR0FBRyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUMsQ0FBQztBQUM5RyxNQUFJLEdBQUcsR0FBRyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7QUFDMUcsTUFBSSxNQUFNLEdBQUcsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDO01BQUUsSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDO0FBQ3BHLE1BQUksSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQztNQUFFLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUN6RCxNQUFJLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNwSCxNQUFJLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUMsQ0FBQzs7OztBQUk5QixNQUFJ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U0FBUyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCckksTUFBSSxNQUFNLEdBQUcsRUFBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxHQUFHLEdBQUcsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNyRixNQUFJLE9BQU8sR0FBRyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ2pELE1BQUksT0FBTyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUN4RyxNQUFJLFVBQVUsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzlDLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxVQUFVLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUM5QyxNQUFJLFdBQVcsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQy9DLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxTQUFTLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUM3QyxNQUFJLFdBQVcsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVB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QUFDLEVBQVEsTUFBTSxFQUFFLENBQUM7QUFDaEYsUUFBSSxFQUFFLENBQUMsRUFBUSxRQUFRLEVBQUUsQ0FBQyxFQUFXLE1BQU0sRUFBRSxDQUFDLEVBQU0sWUFBWSxFQUFFLENBQUMsRUFBSSxFQUFFLEVBQUUsQ0FBQztBQUM1RSxTQUFLLEVBQUUsQ0FBQyxFQUFPLEtBQUssRUFBRSxDQUFDLEVBQWMsSUFBSSxFQUFFLENBQUMsRUFBUyxRQUFRLEVBQUUsQ0FBQyxFQUFPLElBQUksRUFBRSxDQUFDO0FBQzlFLFlBQVEsRUFBRSxDQUFDLEVBQUksWUFBWSxFQUFFLENBQUMsRUFBTyxXQUFXLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQU0sS0FBSyxFQUFFLENBQUM7QUFDL0UsVUFBTSxFQUFFLENBQUMsRUFBTSxRQUFRLEVBQUUsQ0FBQyxFQUFXLElBQUksRUFBRSxDQUFDLEVBQVMsTUFBTSxFQUFFLENBQUMsRUFBUyxRQUFRLEVBQUUsQ0FBQztBQUNsRixXQUFPLEVBQUUsQ0FBQyxFQUFLLE1BQU0sRUFBRSxDQUFDLEVBQWEsTUFBTSxFQUFFLENBQUMsRUFBTyxNQUFNLEVBQUUsQ0FBQyxFQUFTLFFBQVEsRUFBRSxDQUFDO0FBQ2xGLFdBQU8sRUFBRSxDQUFDLEVBQUssVUFBVSxFQUFFLENBQUMsRUFBUyxPQUFPLEVBQUUsQ0FBQyxFQUFNLFNBQVMsRUFBRSxDQUFDLEVBQU0sVUFBVSxFQUFFLENBQUM7QUFDcEYsV0FBTyxFQUFFLENBQUMsRUFBSyxNQUFNLEVBQUUsQ0FBQyxFQUFhLFdBQVcsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBSSxVQUFVLEVBQUUsQ0FBQztBQUNwRixlQUFXLEVBQUUsQ0FBQyxFQUFDLFNBQVMsRUFBRSxDQUFDLEVBQVUsT0FBTyxFQUFFLENBQUMsRUFBTSxRQUFRLEVBQUUsQ0FBQyxFQUFPLFFBQVEsRUFBRSxDQUFDO0FBQ2xGLFlBQVEsRUFBRSxDQUFDLEVBQUksT0FBTyxFQUFFLENBQUMsRUFBWSxNQUFNLEVBQUUsQ0FBQyxFQUFPLFFB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RUFBRSxVQUFTLFFBQVEsRUFBRTtBQUN2QixjQUFJLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQztBQUMvQixpQkFBTyxJQUFJLENBQUM7U0FDZjtBQUNELGtCQUFVLEVBQUUsVUFBUyxPQUFPLEVBQUU7QUFDMUIsZUFBSSxJQUFJLElBQUksSUFBSSxPQUFPLEVBQUU7QUFDckIsZ0JBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7V0FDOUQ7U0FDSjtPQUNKLENBQUM7QUFDRixhQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDM0I7R0FDRixDQUFDOztBQUVGLEdBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OzttQkFJZCxDQUFDIiwiZmlsZSI6InJlYm91bmQucnVudGltZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFByb3BlcnR5IENvbXBpbGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCB0b2tlbml6ZXIgZnJvbSBcInByb3BlcnR5LWNvbXBpbGVyL3Rva2VuaXplclwiO1xuXG52YXIgY29tcHV0ZWRQcm9wZXJ0aWVzID0gW107XG5cbi8vIFRPRE86IE1ha2UgdGhpcyBmYXJycnJyciBtb3JlIHJvYnVzdC4uLnZlcnkgbWluaW1hbCByaWdodCBub3dcblxuZnVuY3Rpb24gY29tcGlsZShwcm9wLCBuYW1lKXtcbiAgdmFyIG91dHB1dCA9IHt9O1xuXG4gIGlmKHByb3AuX19wYXJhbXMpIHJldHVybiBwcm9wLl9fcGFyYW1zO1xuXG4gIHZhciBzdHIgPSBwcm9wLnRvU3RyaW5nKCksIC8vLnJlcGxhY2UoLyg/OlxcL1xcKig/OltcXHNcXFNdKj8pXFwqXFwvKXwoPzooW1xccztdKStcXC9cXC8oPzouKikkKS9nbSwgJyQxJyksIC8vIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBmdW5jdGlvbiBzYW5zIGNvbW1lbnRzXG4gICAgICBuZXh0VG9rZW4gPSB0b2tlbml6ZXIudG9rZW5pemUoc3RyKSxcbiAgICAgIHRva2VucyA9IFtdLFxuICAgICAgdG9rZW4sXG4gICAgICBmaW5pc2hlZFBhdGhzID0gW10sXG4gICAgICBuYW1lZFBhdGhzID0ge30sXG4gICAgICBvcGNvZGVzID0gW10sXG4gICAgICBuYW1lZCA9IGZhbHNlLFxuICAgICAgbGlzdGVuaW5nID0gMCxcbiAgICAgIGluU3ViQ29tcG9uZW50ID0gMCxcbiAgICAgIHN1YkNvbXBvbmVudCA9IFtdLFxuICAgICAgcm9vdCxcbiAgICAgIHBhdGhzID0gW10sXG4gICAgICBwYXRoLFxuICAgICAgdG1wUGF0aCxcbiAgICAgIGF0dHJzID0gW10sXG4gICAgICB3b3JraW5ncGF0aCA9IFtdLFxuICAgICAgdGVybWluYXRvcnMgPSBbJzsnLCcsJywnPT0nLCc+JywnPCcsJz49JywnPD0nLCc+PT0nLCc8PT0nLCchPScsJyE9PScsICc9PT0nLCAnJiYnLCAnfHwnLCAnKycsICctJywgJy8nLCAnKicsICd7JywgJ30nXTtcbiAgZG97XG5cbiAgICB0b2tlbiA9IG5leHRUb2tlbigpO1xuXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICd0aGlzJyl7XG4gICAgICBsaXN0ZW5pbmcrKztcbiAgICAgIHdvcmtpbmdwYXRoID0gW107XG4gICAgfVxuXG4gICAgLy8gVE9ETzogaGFuZGxlIGdldHMgb24gY29sbGVjdGlvbnNcbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ2dldCcpe1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgd2hpbGUoXy5pc1VuZGVmaW5lZChwYXRoLnZhbHVlKSl7XG4gICAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVwbGFjZSBhbnkgYWNjZXNzIHRvIGEgY29sbGVjdGlvbiB3aXRoIHRoZSBnZW5lcmljIEBlYWNoIHBsYWNlaG9sZGVyIGFuZCBwdXNoIGRlcGVuZGFuY3lcbiAgICAgIHdvcmtpbmdwYXRoLnB1c2gocGF0aC52YWx1ZS5yZXBsYWNlKC9cXFsuK1xcXS9nLCBcIi5AZWFjaFwiKS5yZXBsYWNlKC9eXFwuLywgJycpKTtcbiAgICB9XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ3BsdWNrJyl7XG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB3aGlsZShfLmlzVW5kZWZpbmVkKHBhdGgudmFsdWUpKXtcbiAgICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgfVxuXG4gICAgICB3b3JraW5ncGF0aC5wdXNoKCdAZWFjaC4nICsgcGF0aC52YWx1ZSk7XG4gICAgfVxuXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICdzbGljZScgfHwgdG9rZW4udmFsdWUgPT09ICdjbG9uZScgfHwgdG9rZW4udmFsdWUgPT09ICdmaWx0ZXInKXtcbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIGlmKHBhdGgudHlwZS50eXBlID09PSAnKCcpIHdvcmtpbmdwYXRoLnB1c2goJ0BlYWNoJyk7XG4gICAgfVxuXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICdhdCcpe1xuXG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB3aGlsZShfLmlzVW5kZWZpbmVkKHBhdGgudmFsdWUpKXtcbiAgICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgfVxuICAgICAgLy8gd29ya2luZ3BhdGhbd29ya2luZ3BhdGgubGVuZ3RoIC0xXSA9IHdvcmtpbmdwYXRoW3dvcmtpbmdwYXRoLmxlbmd0aCAtMV0gKyAnWycgKyBwYXRoLnZhbHVlICsgJ10nO1xuICAgICAgLy8gd29ya2luZ3BhdGgucHVzaCgnWycgKyBwYXRoLnZhbHVlICsgJ10nKTtcbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goJ0BlYWNoJyk7XG5cbiAgICB9XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ3doZXJlJyB8fCB0b2tlbi52YWx1ZSA9PT0gJ2ZpbmRXaGVyZScpe1xuICAgICAgd29ya2luZ3BhdGgucHVzaCgnQGVhY2gnKTtcbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIGF0dHJzID0gW107XG4gICAgICB2YXIgaXRyID0gMDtcbiAgICAgIHdoaWxlKHBhdGgudHlwZS50eXBlICE9PSAnKScpe1xuICAgICAgICBpZihwYXRoLnZhbHVlKXtcbiAgICAgICAgICBpZihpdHIlMiA9PT0gMCl7XG4gICAgICAgICAgICBhdHRycy5wdXNoKHBhdGgudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpdHIrKztcbiAgICAgICAgfVxuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG4gICAgICB3b3JraW5ncGF0aC5wdXNoKGF0dHJzKTtcbiAgICB9XG5cbiAgICBpZihsaXN0ZW5pbmcgJiYgKF8uaW5kZXhPZih0ZXJtaW5hdG9ycywgdG9rZW4udHlwZS50eXBlKSA+IC0xIHx8IF8uaW5kZXhPZih0ZXJtaW5hdG9ycywgdG9rZW4udmFsdWUpID4gLTEpKXtcbiAgICAgIHdvcmtpbmdwYXRoID0gXy5yZWR1Y2Uod29ya2luZ3BhdGgsIGZ1bmN0aW9uKG1lbW8sIHBhdGhzKXtcbiAgICAgICAgdmFyIG5ld01lbW8gPSBbXTtcbiAgICAgICAgcGF0aHMgPSAoIV8uaXNBcnJheShwYXRocykpID8gW3BhdGhzXSA6IHBhdGhzO1xuICAgICAgICBfLmVhY2gocGF0aHMsIGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgICAgIF8uZWFjaChtZW1vLCBmdW5jdGlvbihtZW0pe1xuICAgICAgICAgICAgbmV3TWVtby5wdXNoKF8uY29tcGFjdChbbWVtLCBwYXRoXSkuam9pbignLicpLnJlcGxhY2UoJy5bJywgJ1snKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmV3TWVtbztcbiAgICAgIH0sIFsnJ10pO1xuICAgICAgZmluaXNoZWRQYXRocyA9IF8uY29tcGFjdChfLnVuaW9uKGZpbmlzaGVkUGF0aHMsIHdvcmtpbmdwYXRoKSk7XG4gICAgICB3b3JraW5ncGF0aCA9IFtdO1xuICAgICAgbGlzdGVuaW5nLS07XG4gICAgfVxuXG4gIH0gd2hpbGUodG9rZW4uc3RhcnQgIT09IHRva2VuLmVuZCk7XG5cbiAgY29uc29sZS5sb2coJ0NPTVBVVEVEIFBST1BFUlRZJywgbmFtZSwgJ3JlZ2lzdGVyZWQgd2l0aCB0aGVzZSBkZXBlbmRhbmN5IHBhdGhzOicsIGZpbmlzaGVkUGF0aHMpO1xuXG4gIC8vIFJldHVybiB0aGUgZGVwZW5kYW5jaWVzIGxpc3RcbiAgcmV0dXJuIHByb3AuX19wYXJhbXMgPSBmaW5pc2hlZFBhdGhzO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgY29tcGlsZTogY29tcGlsZSB9OyIsIi8vIFJlYm91bmQgQ29tcGlsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHsgY29tcGlsZSBhcyBodG1sYmFyc0NvbXBpbGUsIGNvbXBpbGVTcGVjIGFzIGh0bWxiYXJzQ29tcGlsZVNwZWMgfSBmcm9tIFwiaHRtbGJhcnMtY29tcGlsZXIvY29tcGlsZXJcIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcImh0bWxiYXJzLXV0aWwvb2JqZWN0LXV0aWxzXCI7XG5pbXBvcnQgRE9NSGVscGVyIGZyb20gXCJkb20taGVscGVyXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuaW1wb3J0IGhvb2tzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9ob29rc1wiO1xuXG5mdW5jdGlvbiBjb21waWxlKHN0cmluZywgb3B0aW9ucyl7XG4gIC8vIEVuc3VyZSB3ZSBoYXZlIGEgd2VsbC1mb3JtZWQgb2JqZWN0IGFzIHZhciBvcHRpb25zXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmhlbHBlcnMgPSBvcHRpb25zLmhlbHBlcnMgfHwge307XG4gIG9wdGlvbnMuaG9va3MgPSBvcHRpb25zLmhvb2tzIHx8IHt9O1xuXG4gIC8vIE1lcmdlIG91ciBkZWZhdWx0IGhlbHBlcnMgd2l0aCB1c2VyIHByb3ZpZGVkIGhlbHBlcnNcbiAgb3B0aW9ucy5oZWxwZXJzID0gbWVyZ2UoaGVscGVycywgb3B0aW9ucy5oZWxwZXJzKTtcbiAgb3B0aW9ucy5ob29rcyA9IG1lcmdlKGhvb2tzLCBvcHRpb25zLmhvb2tzKTtcblxuICAvLyBDb21waWxlIG91ciB0ZW1wbGF0ZSBmdW5jdGlvblxuICB2YXIgZnVuYyA9IGh0bWxiYXJzQ29tcGlsZShzdHJpbmcsIHtcbiAgICBoZWxwZXJzOiBvcHRpb25zLmhlbHBlcnMsXG4gICAgaG9va3M6IG9wdGlvbnMuaG9va3NcbiAgfSk7XG5cbiAgZnVuYy5fcmVuZGVyID0gZnVuYy5yZW5kZXI7XG5cbiAgLy8gUmV0dXJuIGEgd3JhcHBlciBmdW5jdGlvbiB0aGF0IHdpbGwgbWVyZ2UgdXNlciBwcm92aWRlZCBoZWxwZXJzIHdpdGggb3VyIGRlZmF1bHRzXG4gIGZ1bmMucmVuZGVyID0gZnVuY3Rpb24oZGF0YSwgZW52LCBjb250ZXh0KXtcbiAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHdlbGwtZm9ybWVkIG9iamVjdCBhcyB2YXIgb3B0aW9uc1xuICAgIGVudiA9IGVudiB8fCB7fTtcbiAgICBlbnYuaGVscGVycyA9IGVudi5oZWxwZXJzIHx8IHt9O1xuICAgIGVudi5ob29rcyA9IGVudi5ob29rcyB8fCB7fTtcbiAgICBlbnYuZG9tID0gZW52LmRvbSB8fCBuZXcgRE9NSGVscGVyKCk7XG5cbiAgICAvLyBNZXJnZSBvdXIgZGVmYXVsdCBoZWxwZXJzIGFuZCBob29rcyB3aXRoIHVzZXIgcHJvdmlkZWQgaGVscGVyc1xuICAgIGVudi5oZWxwZXJzID0gbWVyZ2UoaGVscGVycywgZW52LmhlbHBlcnMpO1xuICAgIGVudi5ob29rcyA9IG1lcmdlKGhvb2tzLCBlbnYuaG9va3MpO1xuXG4gICAgLy8gU2V0IGEgZGVmYXVsdCBjb250ZXh0IGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICBjb250ZXh0ID0gY29udGV4dCB8fCBkb2N1bWVudC5ib2R5O1xuXG4gICAgLy8gQ2FsbCBvdXIgZnVuYyB3aXRoIG1lcmdlZCBoZWxwZXJzIGFuZCBob29rc1xuICAgIHJldHVybiBmdW5jLl9yZW5kZXIoZGF0YSwgZW52LCBjb250ZXh0KTtcbiAgfTtcblxuICBoZWxwZXJzLnJlZ2lzdGVyUGFydGlhbCggb3B0aW9ucy5uYW1lLCBmdW5jKTtcblxuICByZXR1cm4gZnVuYztcblxufVxuXG5leHBvcnQgeyBjb21waWxlIH07XG4iLCIvLyBSZWJvdW5kIENvbXBvbmVudFxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgRE9NSGVscGVyIGZyb20gXCJkb20taGVscGVyXCI7XG5pbXBvcnQgaG9va3MgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hvb2tzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gXCJyZWJvdW5kLWRhdGEvcmVib3VuZC1kYXRhXCI7XG5cblxuLy8gSWYgQmFja2JvbmUgaGFzbid0IGJlZW4gc3RhcnRlZCB5ZXQsIHRocm93IGVycm9yXG5pZighd2luZG93LkJhY2tib25lKSB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjtcblxuLy8gUmV0dXJucyB0cnVlIGlmIGBzdHJgIHN0YXJ0cyB3aXRoIGB0ZXN0YFxuZnVuY3Rpb24gc3RhcnRzV2l0aChzdHIsIHRlc3Qpe1xuICBpZihzdHIgPT09IHRlc3QpIHJldHVybiB0cnVlO1xuICBzdHIgPSAkLnNwbGl0UGF0aChzdHIpO1xuICB0ZXN0ID0gJC5zcGxpdFBhdGgodGVzdCk7XG4gIHdoaWxlKHRlc3RbMF0gJiYgc3RyWzBdKXtcbiAgICBpZihzdHJbMF0gIT09IHRlc3RbMF0gJiYgc3RyWzBdICE9PSAnQGVhY2gnICYmIHRlc3RbMF0gIT09ICdAZWFjaCcpIHJldHVybiBmYWxzZTtcbiAgICB0ZXN0LnNoaWZ0KCk7XG4gICAgc3RyLnNoaWZ0KCk7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNhbGxiYWNrKCl7XG4gIHZhciBpID0gMCwgbGVuID0gdGhpcy5fdG9SZW5kZXIubGVuZ3RoO1xuICBkZWxldGUgdGhpcy5fcmVuZGVyVGltZW91dDtcbiAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgIHRoaXMuX3RvUmVuZGVyLnNoaWZ0KCkubm90aWZ5KCk7XG4gIH1cbiAgdGhpcy5fdG9SZW5kZXIuYWRkZWQgPSB7fTtcbn1cblxuZnVuY3Rpb24gaHlkcmF0ZShzcGVjLCBvcHRpb25zKXtcbiAgLy8gUmV0dXJuIGEgd3JhcHBlciBmdW5jdGlvbiB0aGF0IHdpbGwgbWVyZ2UgdXNlciBwcm92aWRlZCBoZWxwZXJzIGFuZCBob29rcyB3aXRoIG91ciBkZWZhdWx0c1xuICByZXR1cm4gZnVuY3Rpb24oZGF0YSwgb3B0aW9ucyl7XG5cbiAgICAvLyBSZWJvdW5kJ3MgZGVmYXVsdCBlbnZpcm9ubWVudFxuICAgIC8vIFRoZSBhcHBsaWNhdGlvbiBlbnZpcm9ubWVudCBpcyBwcm9wYWdhdGVkIGRvd24gZWFjaCByZW5kZXIgY2FsbCBhbmRcbiAgICAvLyBhdWdtZW50ZWQgd2l0aCBoZWxwZXJzIGFzIGl0IGdvZXNcbiAgICB2YXIgZW52ID0ge1xuICAgICAgaGVscGVyczogaGVscGVycy5oZWxwZXJzLFxuICAgICAgaG9va3M6IGhvb2tzLFxuICAgICAgZG9tOiBuZXcgRE9NSGVscGVyKCksXG4gICAgICB1c2VGcmFnbWVudENhY2hlOiB0cnVlXG4gICAgfTtcblxuICAgIC8vIEVuc3VyZSB3ZSBoYXZlIGEgY29udGV4dHVhbCBlbGVtZW50IHRvIHBhc3MgdG8gcmVuZGVyXG4gICAgdmFyIGNvbnRleHRFbGVtZW50ID0gZGF0YS5lbCB8fCBkb2N1bWVudC5ib2R5O1xuXG4gICAgLy8gTWVyZ2Ugb3VyIGRlZmF1bHQgaGVscGVycyBhbmQgaG9va3Mgd2l0aCB1c2VyIHByb3ZpZGVkIGhlbHBlcnNcbiAgICBlbnYuaGVscGVycyA9IF8uZGVmYXVsdHMoKG9wdGlvbnMuaGVscGVycyB8fCB7fSksIGVudi5oZWxwZXJzKTtcbiAgICBlbnYuaG9va3MgPSBfLmRlZmF1bHRzKChvcHRpb25zLmhvb2tzIHx8IHt9KSwgZW52Lmhvb2tzKTtcblxuICAgIC8vIENhbGwgb3VyIGZ1bmMgd2l0aCBtZXJnZWQgaGVscGVycyBhbmQgaG9va3NcbiAgICByZXR1cm4gc3BlYy5yZW5kZXIoZGF0YSwgZW52LCBjb250ZXh0RWxlbWVudCk7XG4gIH07XG59O1xuXG4vLyBOZXcgQmFja2JvbmUgQ29tcG9uZW50XG52YXIgQ29tcG9uZW50ID0gTW9kZWwuZXh0ZW5kKHtcblxuICBpc0NvbXBvbmVudDogdHJ1ZSxcblxuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgXy5iaW5kQWxsKHRoaXMsICdfX2NhbGxPbkNvbXBvbmVudCcpO1xuICAgIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnY29tcG9uZW50Jyk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5jaGFuZ2VkID0ge307XG4gICAgdGhpcy5oZWxwZXJzID0ge307XG4gICAgdGhpcy5fX3BhcmVudF9fID0gdGhpcy5fX3Jvb3RfXyA9IHRoaXM7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLCAnYWxsJywgdGhpcy5fb25DaGFuZ2UpO1xuXG4gICAgLy8gVGFrZSBvdXIgcGFyc2VkIGRhdGEgYW5kIGFkZCBpdCB0byBvdXIgYmFja2JvbmUgZGF0YSBzdHJ1Y3R1cmUuIERvZXMgYSBkZWVwIGRlZmF1bHRzIHNldC5cbiAgICAvLyBJbiB0aGUgbW9kZWwsIHByaW1hdGl2ZXMgKGFycmF5cywgb2JqZWN0cywgZXRjKSBhcmUgY29udmVydGVkIHRvIEJhY2tib25lIE9iamVjdHNcbiAgICAvLyBGdW5jdGlvbnMgYXJlIGNvbXBpbGVkIHRvIGZpbmQgdGhlaXIgZGVwZW5kYW5jaWVzIGFuZCBhZGRlZCBhcyBjb21wdXRlZCBwcm9wZXJ0aWVzXG4gICAgLy8gU2V0IG91ciBjb21wb25lbnQncyBjb250ZXh0IHdpdGggdGhlIHBhc3NlZCBkYXRhIG1lcmdlZCB3aXRoIHRoZSBjb21wb25lbnQncyBkZWZhdWx0c1xuICAgIHRoaXMuc2V0KCh0aGlzLmRlZmF1bHRzIHx8IHt9KSwge2RlZmF1bHRzOiB0cnVlfSk7XG4gICAgdGhpcy5zZXQoKG9wdGlvbnMuZGF0YSB8fCB7fSkpO1xuXG4gICAgLy8gQ2FsbCBvbiBjb21wb25lbnQgaXMgdXNlZCBieSB0aGUge3tvbn19IGhlbHBlciB0byBjYWxsIGFsbCBldmVudCBjYWxsYmFja3MgaW4gdGhlIHNjb3BlIG9mIHRoZSBjb21wb25lbnRcbiAgICB0aGlzLmhlbHBlcnMuX19jYWxsT25Db21wb25lbnQgPSB0aGlzLl9fY2FsbE9uQ29tcG9uZW50O1xuXG5cbiAgICAvLyBHZXQgYW55IGFkZGl0aW9uYWwgcm91dGVzIHBhc3NlZCBpbiBmcm9tIG9wdGlvbnNcbiAgICB0aGlzLnJvdXRlcyA9ICBfLmRlZmF1bHRzKChvcHRpb25zLnJvdXRlcyB8fCB7fSksIHRoaXMucm91dGVzKTtcbiAgICAvLyBFbnN1cmUgdGhhdCBhbGwgcm91dGUgZnVuY3Rpb25zIGV4aXN0XG4gICAgXy5lYWNoKHRoaXMucm91dGVzLCBmdW5jdGlvbih2YWx1ZSwga2V5LCByb3V0ZXMpe1xuICAgICAgICBpZih0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKXsgdGhyb3coJ0Z1bmN0aW9uIG5hbWUgcGFzc2VkIHRvIHJvdXRlcyBpbiAgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQgbXVzdCBiZSBhIHN0cmluZyEnKTsgfVxuICAgICAgICBpZighdGhpc1t2YWx1ZV0peyB0aHJvdygnQ2FsbGJhY2sgZnVuY3Rpb24gJyt2YWx1ZSsnIGRvZXMgbm90IGV4aXN0IG9uIHRoZSAgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQhJyk7IH1cbiAgICB9LCB0aGlzKTtcblxuXG4gICAgLy8gU2V0IG91ciBvdXRsZXQgYW5kIHRlbXBsYXRlIGlmIHdlIGhhdmUgb25lXG4gICAgdGhpcy5lbCA9IG9wdGlvbnMub3V0bGV0IHx8IHVuZGVmaW5lZDtcbiAgICB0aGlzLiRlbCA9IChfLmlzVW5kZWZpbmVkKHdpbmRvdy5CYWNrYm9uZS4kKSkgPyBmYWxzZSA6IHdpbmRvdy5CYWNrYm9uZS4kKHRoaXMuZWwpO1xuXG4gICAgaWYoXy5pc0Z1bmN0aW9uKHRoaXMuY3JlYXRlZENhbGxiYWNrKSl7XG4gICAgICB0aGlzLmNyZWF0ZWRDYWxsYmFjay5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIC8vIFRha2Ugb3VyIHByZWNvbXBpbGVkIHRlbXBsYXRlIGFuZCBoeWRyYXRlcyBpdC4gV2hlbiBSZWJvdW5kIENvbXBpbGVyIGlzIGluY2x1ZGVkLCBjYW4gYmUgYSBoYW5kbGViYXJzIHRlbXBsYXRlIHN0cmluZy5cbiAgICAvLyBUT0RPOiBDaGVjayBpZiB0ZW1wbGF0ZSBpcyBhIHN0cmluZywgYW5kIGlmIHRoZSBjb21waWxlciBleGlzdHMgb24gdGhlIHBhZ2UsIGFuZCBjb21waWxlIGlmIG5lZWRlZFxuICAgIGlmKCFvcHRpb25zLnRlbXBsYXRlICYmICF0aGlzLnRlbXBsYXRlKXsgdGhyb3coJ1RlbXBsYXRlIG11c3QgcHJvdmlkZWQgZm9yICcgKyB0aGlzLl9fbmFtZSArICcgY29tcG9uZW50IScpOyB9XG4gICAgdGhpcy50ZW1wbGF0ZSA9IG9wdGlvbnMudGVtcGxhdGUgfHwgdGhpcy50ZW1wbGF0ZTtcbiAgICB0aGlzLnRlbXBsYXRlID0gKHR5cGVvZiB0aGlzLnRlbXBsYXRlID09PSAnb2JqZWN0JykgPyBoeWRyYXRlKHRoaXMudGVtcGxhdGUpIDogdGhpcy50ZW1wbGF0ZTtcblxuXG4gICAgLy8gUmVuZGVyIG91ciBkb20gYW5kIHBsYWNlIHRoZSBkb20gaW4gb3VyIGN1c3RvbSBlbGVtZW50XG4gICAgLy8gVGVtcGxhdGUgYWNjZXB0cyBbZGF0YSwgb3B0aW9ucywgY29udGV4dHVhbEVsZW1lbnRdXG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLnRlbXBsYXRlKHRoaXMsIHtoZWxwZXJzOiB0aGlzLmhlbHBlcnN9LCB0aGlzLmVsKSk7XG5cbiAgICAvLyBBZGQgYWN0aXZlIGNsYXNzIHRvIHRoaXMgbmV3bHkgcmVuZGVyZWQgdGVtcGxhdGUncyBsaW5rIGVsZW1lbnRzIHRoYXQgcmVxdWlyZSBpdFxuICAgICQodGhpcy5lbCkubWFya0xpbmtzKCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemUoKTtcblxuICB9LFxuXG4gICQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgaWYoIXRoaXMuJGVsKXtcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdObyBET00gbWFuaXB1bGF0aW9uIGxpYnJhcnkgb24gdGhlIHBhZ2UhJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiRlbC5maW5kKHNlbGVjdG9yKTtcbiAgfSxcblxuICAvLyBUcmlnZ2VyIGFsbCBldmVudHMgb24gYm90aCB0aGUgY29tcG9uZW50IGFuZCB0aGUgZWxlbWVudFxuICB0cmlnZ2VyOiBmdW5jdGlvbihldmVudE5hbWUpe1xuICAgIGlmKHRoaXMuZWwpe1xuICAgICAgJCh0aGlzLmVsKS50cmlnZ2VyKGV2ZW50TmFtZSwgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnRyaWdnZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcblxuICBfX2NhbGxPbkNvbXBvbmVudDogZnVuY3Rpb24obmFtZSwgZXZlbnQpe1xuICAgIGlmKCFfLmlzRnVuY3Rpb24odGhpc1tuYW1lXSkpeyB0aHJvdyBcIkVSUk9SOiBObyBtZXRob2QgbmFtZWQgXCIgKyBuYW1lICsgXCIgb24gY29tcG9uZW50IFwiICsgdGhpcy5fX25hbWUgKyBcIiFcIjsgfVxuICAgIHJldHVybiB0aGlzW25hbWVdLmNhbGwodGhpcywgZXZlbnQpO1xuICB9LFxuXG4gIF9vbkF0dHJpYnV0ZUNoYW5nZTogZnVuY3Rpb24oYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKXtcbiAgICAvLyBDb21tZW50ZWQgb3V0IGJlY2F1c2UgdHJhY2tpbmcgYXR0cmlidXRlIGNoYW5nZXMgYW5kIG1ha2luZyBzdXJlIHRoZXkgZG9udCBpbmZpbml0ZSBsb29wIGlzIGhhcmQuXG4gICAgLy8gVE9ETzogTWFrZSB3b3JrLlxuICAgIC8vIHRyeXsgbmV3VmFsID0gSlNPTi5wYXJzZShuZXdWYWwpOyB9IGNhdGNoIChlKXsgbmV3VmFsID0gbmV3VmFsOyB9XG4gICAgLy9cbiAgICAvLyAvLyBkYXRhIGF0dHJpYnV0ZXMgc2hvdWxkIGJlIHJlZmVyYW5jZWQgYnkgdGhlaXIgY2FtZWwgY2FzZSBuYW1lXG4gICAgLy8gYXR0ck5hbWUgPSBhdHRyTmFtZS5yZXBsYWNlKC9eZGF0YS0vZywgXCJcIikucmVwbGFjZSgvLShbYS16XSkvZywgZnVuY3Rpb24gKGcpIHsgcmV0dXJuIGdbMV0udG9VcHBlckNhc2UoKTsgfSk7XG4gICAgLy9cbiAgICAvLyBvbGRWYWwgPSB0aGlzLmdldChhdHRyTmFtZSk7XG4gICAgLy9cbiAgICAvLyBpZihuZXdWYWwgPT09IG51bGwpeyB0aGlzLnVuc2V0KGF0dHJOYW1lKTsgfVxuICAgIC8vXG4gICAgLy8gLy8gSWYgb2xkVmFsIGlzIGEgbnVtYmVyLCBhbmQgbmV3VmFsIGlzIG9ubHkgbnVtZXJpY2FsLCBwcmVzZXJ2ZSB0eXBlXG4gICAgLy8gaWYoXy5pc051bWJlcihvbGRWYWwpICYmIF8uaXNTdHJpbmcobmV3VmFsKSAmJiBuZXdWYWwubWF0Y2goL15bMC05XSokL2kpKXtcbiAgICAvLyAgIG5ld1ZhbCA9IHBhcnNlSW50KG5ld1ZhbCk7XG4gICAgLy8gfVxuICAgIC8vXG4gICAgLy8gZWxzZXsgdGhpcy5zZXQoYXR0ck5hbWUsIG5ld1ZhbCwge3F1aWV0OiB0cnVlfSk7IH1cbiAgfSxcblxuXG4gIF9vbkNoYW5nZTogZnVuY3Rpb24odHlwZSwgbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpe1xuICAgIHZhciBzaG9ydGNpcmN1aXQgPSB7IGNoYW5nZTogMSwgc29ydDogMSwgcmVxdWVzdDogMSwgZGVzdHJveTogMSwgc3luYzogMSwgZXJyb3I6IDEsIGludmFsaWQ6IDEsIHJvdXRlOiAxLCBkaXJ0eTogMSB9O1xuICAgIGlmKCBzaG9ydGNpcmN1aXRbdHlwZV0gKSByZXR1cm47XG5cbiAgICB2YXIgZGF0YSwgY2hhbmdlZDtcbiAgICBtb2RlbCB8fCAobW9kZWwgPSB7fSk7XG4gICAgY29sbGVjdGlvbiB8fCAoY29sbGVjdGlvbiA9IHt9KTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgICFjb2xsZWN0aW9uLmlzRGF0YSAmJiAob3B0aW9ucyA9IGNvbGxlY3Rpb24pICYmIChjb2xsZWN0aW9uID0gbW9kZWwpO1xuICAgIHRoaXMuX3RvUmVuZGVyIHx8ICh0aGlzLl90b1JlbmRlciA9IFtdKTtcblxuICAgIGlmKCAodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzQXR0cmlidXRlcykgfHwgdHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgIT09IC0xKXtcbiAgICAgIGRhdGEgPSBtb2RlbDtcbiAgICAgIGNoYW5nZWQgPSBtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpO1xuICAgIH1cbiAgICBlbHNlIGlmKHR5cGUgPT09ICdhZGQnIHx8IHR5cGUgPT09ICdyZW1vdmUnIHx8ICh0eXBlID09PSAncmVzZXQnICYmIG9wdGlvbnMucHJldmlvdXNNb2RlbHMpKXtcbiAgICAgIGRhdGEgPSBjb2xsZWN0aW9uO1xuICAgICAgY2hhbmdlZCA9IHtcbiAgICAgICAgJ0BlYWNoJzogZGF0YVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZighZGF0YSB8fCAhY2hhbmdlZCkgcmV0dXJuO1xuXG4gICAgdmFyIHB1c2ggPSBmdW5jdGlvbihhcnIpe1xuICAgICAgdmFyIGksIGxlbiA9IGFyci5sZW5ndGg7XG4gICAgICB0aGlzLmFkZGVkIHx8ICh0aGlzLmFkZGVkID0ge30pO1xuICAgICAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgICAgICBpZih0aGlzLmFkZGVkW2FycltpXS5jaWRdKSBjb250aW51ZTtcbiAgICAgICAgdGhpcy5hZGRlZFthcnJbaV0uY2lkXSA9IDE7XG4gICAgICAgIHRoaXMucHVzaChhcnJbaV0pO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuICAgIHZhciBiYXNlUGF0aCA9IGRhdGEuX19wYXRoKCk7XG4gICAgdmFyIHBhcnRzID0gJC5zcGxpdFBhdGgoYmFzZVBhdGgpO1xuICAgIHZhciBrZXksIG9ic1BhdGgsIHBhdGgsIG9ic2VydmVycztcblxuICAgIC8vIEZvciBlYWNoIGNoYW5nZWQga2V5LCB3YWxrIGRvd24gdGhlIGRhdGEgdHJlZSBmcm9tIHRoZSByb290IHRvIHRoZSBkYXRhXG4gICAgLy8gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnQgYW5kIGFkZCBhbGwgcmVsZXZlbnQgY2FsbGJhY2tzIHRvIHRoaXNcbiAgICAvLyBvYmplY3QncyBfdG9SZW5kZXIgcXVldWUuXG4gICAgZG97XG4gICAgICBmb3Ioa2V5IGluIGNoYW5nZWQpe1xuICAgICAgICBwYXRoID0gKGJhc2VQYXRoICsgKGJhc2VQYXRoICYmIGtleSAmJiAnLicpICsga2V5KS5yZXBsYWNlKGNvbnRleHQuX19wYXRoKCksICcnKS5yZXBsYWNlKC9cXFtbXlxcXV0rXFxdL2csIFwiLkBlYWNoXCIpLnJlcGxhY2UoL15cXC4vLCAnJyk7XG4gICAgICAgIGZvcihvYnNQYXRoIGluIGNvbnRleHQuX19vYnNlcnZlcnMpe1xuICAgICAgICAgIG9ic2VydmVycyA9IGNvbnRleHQuX19vYnNlcnZlcnNbb2JzUGF0aF07XG4gICAgICAgICAgaWYoc3RhcnRzV2l0aChvYnNQYXRoLCBwYXRoKSl7XG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgY29sbGVjdGlvbiBldmVudCwgdHJpZ2dlciBldmVyeXRoaW5nLCBvdGhlcndpc2Ugb25seSB0cmlnZ2VyIHByb3BlcnR5IGNoYW5nZSBjYWxsYmFja3NcbiAgICAgICAgICAgIGlmKGRhdGEuaXNDb2xsZWN0aW9uKSBwdXNoLmNhbGwodGhpcy5fdG9SZW5kZXIsIG9ic2VydmVycy5jb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHB1c2guY2FsbCh0aGlzLl90b1JlbmRlciwgb2JzZXJ2ZXJzLm1vZGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IHdoaWxlKGNvbnRleHQgIT09IGRhdGEgJiYgKGNvbnRleHQgPSBjb250ZXh0LmdldChwYXJ0cy5zaGlmdCgpKSkpXG5cbiAgICAvLyBRdWV1ZSBvdXIgcmVuZGVyIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhcyBiZWVuIGV4aGF1c3RlZFxuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5fcmVuZGVyVGltZW91dCk7XG4gICAgdGhpcy5fcmVuZGVyVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KF8uYmluZChyZW5kZXJDYWxsYmFjaywgdGhpcyksIDApO1xuICB9XG5cbn0pO1xuXG5Db21wb25lbnQuZXh0ZW5kPSBmdW5jdGlvbihwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICB2YXIgcGFyZW50ID0gdGhpcyxcbiAgICAgIGNoaWxkLFxuICAgICAgcmVzZXJ2ZWRNZXRob2RzID0ge1xuICAgICAgICAndHJpZ2dlcic6MSwgICAgJ2NvbnN0cnVjdG9yJzoxLCAnZ2V0JzoxLCAgICAgICAgICAgICAgICdzZXQnOjEsICAgICAgICAgICAgICdoYXMnOjEsXG4gICAgICAgICdleHRlbmQnOjEsICAgICAnZXNjYXBlJzoxLCAgICAgICd1bnNldCc6MSwgICAgICAgICAgICAgJ2NsZWFyJzoxLCAgICAgICAgICAgJ2NpZCc6MSxcbiAgICAgICAgJ2F0dHJpYnV0ZXMnOjEsICdjaGFuZ2VkJzoxLCAgICAgJ3RvSlNPTic6MSwgICAgICAgICAgICAndmFsaWRhdGlvbkVycm9yJzoxLCAnaXNWYWxpZCc6MSxcbiAgICAgICAgJ2lzTmV3JzoxLCAgICAgICdoYXNDaGFuZ2VkJzoxLCAgJ2NoYW5nZWRBdHRyaWJ1dGVzJzoxLCAncHJldmlvdXMnOjEsICAgICAgICAncHJldmlvdXNBdHRyaWJ1dGVzJzoxXG4gICAgICB9LFxuICAgICAgY29uZmlnUHJvcGVydGllcyA9IHtcbiAgICAgICAgJ3JvdXRlcyc6MSwgICAgICd0ZW1wbGF0ZSc6MSwgICAgJ2RlZmF1bHRzJzoxLCAnb3V0bGV0JzoxLCAgICAgICAgICAndXJsJzoxLFxuICAgICAgICAndXJsUm9vdCc6MSwgICAgJ2lkQXR0cmlidXRlJzoxLCAnaWQnOjEsICAgICAgICdjcmVhdGVkQ2FsbGJhY2snOjEsICdhdHRhY2hlZENhbGxiYWNrJzoxLFxuICAgICAgICAnZGV0YWNoZWRDYWxsYmFjayc6MVxuICAgICAgfTtcblxuICBwcm90b1Byb3BzLmRlZmF1bHRzID0ge307XG5cbiAgLy8gRm9yIGVhY2ggcHJvcGVydHkgcGFzc2VkIGludG8gb3VyIGNvbXBvbmVudCBiYXNlIGNsYXNzXG4gIF8uZWFjaChwcm90b1Byb3BzLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBwcm90b1Byb3BzKXtcblxuICAgIC8vIElmIGEgY29uZmlndXJhdGlvbiBwcm9wZXJ0eSwgaWdub3JlIGl0XG4gICAgaWYoY29uZmlnUHJvcGVydGllc1trZXldKXsgcmV0dXJuOyB9XG5cbiAgICAvLyBJZiBhIHByaW1hdGl2ZSBvciBiYWNrYm9uZSB0eXBlIG9iamVjdCwgb3IgY29tcHV0ZWQgcHJvcGVydHkgKGZ1bmN0aW9uIHdoaWNoIHRha2VzIG5vIGFyZ3VtZW50cyBhbmQgcmV0dXJucyBhIHZhbHVlKSBtb3ZlIGl0IHRvIG91ciBkZWZhdWx0c1xuICAgIGlmKCFfLmlzRnVuY3Rpb24odmFsdWUpIHx8IHZhbHVlLmlzTW9kZWwgfHwgdmFsdWUuaXNDb21wb25lbnQgfHwgKF8uaXNGdW5jdGlvbih2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwICYmIHZhbHVlLnRvU3RyaW5nKCkuaW5kZXhPZigncmV0dXJuJykgPiAtMSkpe1xuICAgICAgcHJvdG9Qcm9wcy5kZWZhdWx0c1trZXldID0gdmFsdWU7XG4gICAgICBkZWxldGUgcHJvdG9Qcm9wc1trZXldO1xuICAgIH1cblxuICAgIC8vIElmIGEgcmVzZXJ2ZWQgbWV0aG9kLCB5ZWxsXG4gICAgaWYocmVzZXJ2ZWRNZXRob2RzW2tleV0peyB0aHJvdyBcIkVSUk9SOiBcIiArIGtleSArIFwiIGlzIGEgcmVzZXJ2ZWQgbWV0aG9kIG5hbWUgaW4gXCIgKyBzdGF0aWNQcm9wcy5fX25hbWUgKyBcIiFcIjsgfVxuXG4gICAgLy8gQWxsIG90aGVyIHZhbHVlcyBhcmUgY29tcG9uZW50IG1ldGhvZHMsIGxlYXZlIHRoZW0gYmUgdW5sZXNzIGFscmVhZHkgZGVmaW5lZC5cblxuICB9LCB0aGlzKTtcblxuICAvLyBJZiBnaXZlbiBhIGNvbnN0cnVjdG9yLCB1c2UgaXQsIG90aGVyd2lzZSB1c2UgdGhlIGRlZmF1bHQgb25lIGRlZmluZWQgYWJvdmVcbiAgaWYgKHByb3RvUHJvcHMgJiYgXy5oYXMocHJvdG9Qcm9wcywgJ2NvbnN0cnVjdG9yJykpIHtcbiAgICBjaGlsZCA9IHByb3RvUHJvcHMuY29uc3RydWN0b3I7XG4gIH0gZWxzZSB7XG4gICAgY2hpbGQgPSBmdW5jdGlvbigpeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gIH1cblxuICAvLyBPdXIgY2xhc3Mgc2hvdWxkIGluaGVyaXQgZXZlcnl0aGluZyBmcm9tIGl0cyBwYXJlbnQsIGRlZmluZWQgYWJvdmVcbiAgdmFyIFN1cnJvZ2F0ZSA9IGZ1bmN0aW9uKCl7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfTtcbiAgU3Vycm9nYXRlLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBTdXJyb2dhdGUoKTtcblxuICAvLyBFeHRlbmQgb3VyIHByb3RvdHlwZSB3aXRoIGFueSByZW1haW5pbmcgcHJvdG9Qcm9wcywgb3ZlcnJpdGluZyBwcmUtZGVmaW5lZCBvbmVzXG4gIGlmIChwcm90b1Byb3BzKXsgXy5leHRlbmQoY2hpbGQucHJvdG90eXBlLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcyk7IH1cblxuICAvLyBTZXQgb3VyIGFuY2VzdHJ5XG4gIGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7XG5cbiAgcmV0dXJuIGNoaWxkO1xufTtcblxuQ29tcG9uZW50LnJlZ2lzdGVyID0gZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnQobmFtZSwgb3B0aW9ucykge1xuICB2YXIgc2NyaXB0ID0gb3B0aW9ucy5wcm90b3R5cGU7XG4gIHZhciB0ZW1wbGF0ZSA9IG9wdGlvbnMudGVtcGxhdGU7XG4gIHZhciBzdHlsZSA9IG9wdGlvbnMuc3R5bGU7XG5cbiAgdmFyIGNvbXBvbmVudCA9IHRoaXMuZXh0ZW5kKHNjcmlwdCwgeyBfX25hbWU6IG5hbWUgfSk7XG4gIHZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlLCB7fSk7XG5cbiAgcHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fX2NvbXBvbmVudF9fID0gbmV3IGNvbXBvbmVudCh7XG4gICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgICBvdXRsZXQ6IHRoaXMsXG4gICAgICBkYXRhOiBSZWJvdW5kLnNlZWREYXRhXG4gICAgfSk7XG4gIH07XG5cbiAgcHJvdG8uYXR0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHNjcmlwdC5hdHRhY2hlZENhbGxiYWNrICYmIHNjcmlwdC5hdHRhY2hlZENhbGxiYWNrLmNhbGwodGhpcy5fX2NvbXBvbmVudF9fKTtcbiAgfTtcblxuICBwcm90by5kZXRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgc2NyaXB0LmRldGFjaGVkQ2FsbGJhY2sgJiYgc2NyaXB0LmRldGFjaGVkQ2FsbGJhY2suY2FsbCh0aGlzLl9fY29tcG9uZW50X18pO1xuICAgIHRoaXMuX19jb21wb25lbnRfXy5kZWluaXRpYWxpemUoKTtcbiAgfTtcblxuICBwcm90by5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgPSBmdW5jdGlvbihhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpIHtcbiAgICB0aGlzLl9fY29tcG9uZW50X18uX29uQXR0cmlidXRlQ2hhbmdlKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCk7XG4gICAgc2NyaXB0LmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayAmJiBzY3JpcHQuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrLmNhbGwodGhpcy5fX2NvbXBvbmVudF9fLCBhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpO1xuICB9O1xuXG4gIHJldHVybiBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQobmFtZSwgeyBwcm90b3R5cGU6IHByb3RvIH0pO1xufVxuXG5fLmJpbmRBbGwoQ29tcG9uZW50LCAncmVnaXN0ZXInKTtcblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50O1xuIiwiLy8gUmVib3VuZCBDb2xsZWN0aW9uXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBNb2RlbCBmcm9tIFwicmVib3VuZC1kYXRhL21vZGVsXCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuZnVuY3Rpb24gcGF0aEdlbmVyYXRvcihjb2xsZWN0aW9uKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uX19wYXRoKCkgKyAnWycgKyBjb2xsZWN0aW9uLmluZGV4T2YoY29sbGVjdGlvbi5fYnlJZFt0aGlzLmNpZF0pICsgJ10nO1xuICB9O1xufVxuXG52YXIgQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcblxuICBpc0NvbGxlY3Rpb246IHRydWUsXG4gIGlzRGF0YTogdHJ1ZSxcblxuICBtb2RlbDogdGhpcy5tb2RlbCB8fCBNb2RlbCxcblxuICBfX3BhdGg6IGZ1bmN0aW9uKCl7cmV0dXJuICcnO30sXG5cbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucyl7XG4gICAgbW9kZWxzIHx8IChtb2RlbHMgPSBbXSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB0aGlzLl9fb2JzZXJ2ZXJzID0ge307XG4gICAgdGhpcy5oZWxwZXJzID0ge307XG4gICAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdjb2xsZWN0aW9uJyk7XG5cbiAgICAvLyBTZXQgbGluZWFnZVxuICAgIHRoaXMuc2V0UGFyZW50KCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICk7XG4gICAgdGhpcy5zZXRSb290KCBvcHRpb25zLnJvb3QgfHwgdGhpcyApO1xuICAgIHRoaXMuX19wYXRoID0gb3B0aW9ucy5wYXRoIHx8IHRoaXMuX19wYXRoO1xuXG4gICAgQmFja2JvbmUuQ29sbGVjdGlvbi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cbiAgICAvLyBXaGVuIGEgbW9kZWwgaXMgcmVtb3ZlZCBmcm9tIGl0cyBvcmlnaW5hbCBjb2xsZWN0aW9uLCBkZXN0cm95IGl0XG4gICAgLy8gVE9ETzogRml4IHRoaXMuIENvbXB1dGVkIHByb3BlcnRpZXMgbm93IHNvbWVob3cgYWxsb3cgY29sbGVjdGlvbiB0byBzaGFyZSBhIG1vZGVsLiBUaGV5IG1heSBiZSByZW1vdmVkIGZyb20gb25lIGJ1dCBub3QgdGhlIG90aGVyLiBUaGF0IGlzIGJhZC5cbiAgICAvLyBUaGUgY2xvbmUgPSBmYWxzZSBvcHRpb25zIGlzIHRoZSBjdWxwcml0LiBGaW5kIGEgYmV0dGVyIHdheSB0byBjb3B5IGFsbCBvZiB0aGUgY29sbGVjdGlvbnMgY3VzdG9tIGF0dHJpYnV0ZXMgb3ZlciB0byB0aGUgY2xvbmUuXG4gICAgdGhpcy5vbigncmVtb3ZlJywgZnVuY3Rpb24obW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpe1xuICAgICAgLy8gbW9kZWwuZGVpbml0aWFsaXplKCk7XG4gICAgfSk7XG5cbiAgfSxcblxuICBnZXQ6IGZ1bmN0aW9uKGtleSwgb3B0aW9ucyl7XG5cbiAgICAvLyBJZiB0aGUga2V5IGlzIGEgbnVtYmVyIG9yIG9iamVjdCwgZGVmYXVsdCB0byBiYWNrYm9uZSdzIGNvbGxlY3Rpb24gZ2V0XG4gICAgaWYodHlwZW9mIGtleSA9PSAnbnVtYmVyJyB8fCB0eXBlb2Yga2V5ID09ICdvYmplY3QnKXtcbiAgICAgIHJldHVybiBCYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5nZXQuY2FsbCh0aGlzLCBrZXkpO1xuICAgIH1cblxuICAgIC8vIElmIGtleSBpcyBub3QgYSBzdHJpbmcsIHJldHVybiB1bmRlZmluZWRcbiAgICBpZiAoIV8uaXNTdHJpbmcoa2V5KSkgcmV0dXJuIHZvaWQgMDtcblxuICAgIC8vIFNwbGl0IHRoZSBwYXRoIGF0IGFsbCAnLicsICdbJyBhbmQgJ10nIGFuZCBmaW5kIHRoZSB2YWx1ZSByZWZlcmFuY2VkLlxuICAgIHZhciBwYXJ0cyAgPSAkLnNwbGl0UGF0aChrZXkpLFxuICAgICAgICByZXN1bHQgPSB0aGlzLFxuICAgICAgICBsPXBhcnRzLmxlbmd0aCxcbiAgICAgICAgaT0wO1xuICAgICAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgaWYoXy5pc1VuZGVmaW5lZChrZXkpIHx8IF8uaXNOdWxsKGtleSkpIHJldHVybiBrZXk7XG4gICAgaWYoa2V5ID09PSAnJyB8fCBwYXJ0cy5sZW5ndGggPT09IDApIHJldHVybiByZXN1bHQ7XG5cbiAgICBpZiAocGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yICggaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgLy8gSWYgcmV0dXJuaW5nIHJhdywgYWx3YXlzIHJldHVybiB0aGUgZmlyc3QgY29tcHV0ZWQgcHJvcGVydHkgZm91bmQuIElmIHVuZGVmaW5lZCwgeW91J3JlIGRvbmUuXG4gICAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmIG9wdGlvbnMucmF3KSByZXR1cm4gcmVzdWx0O1xuICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSkgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG4gICAgICAgIGlmKF8uaXNVbmRlZmluZWQocmVzdWx0KSB8fCBfLmlzTnVsbChyZXN1bHQpKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICBpZihwYXJ0c1tpXSA9PT0gJ0BwYXJlbnQnKSByZXN1bHQgPSByZXN1bHQuX19wYXJlbnRfXztcbiAgICAgICAgZWxzZSBpZihyZXN1bHQuaXNDb2xsZWN0aW9uKSByZXN1bHQgPSByZXN1bHQubW9kZWxzW3BhcnRzW2ldXTtcbiAgICAgICAgZWxzZSBpZihyZXN1bHQuaXNNb2RlbCkgcmVzdWx0ID0gcmVzdWx0LmF0dHJpYnV0ZXNbcGFydHNbaV1dO1xuICAgICAgICBlbHNlIGlmKHJlc3VsdC5oYXNPd25Qcm9wZXJ0eShwYXJ0c1tpXSkpIHJlc3VsdCA9IHJlc3VsdFtwYXJ0c1tpXV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkgJiYgIW9wdGlvbnMucmF3KSByZXN1bHQgPSByZXN1bHQudmFsdWUoKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpe1xuICAgIHZhciBuZXdNb2RlbHMgPSBbXSxcbiAgICAgICAgbGluZWFnZSA9IHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgcm9vdDogdGhpcy5fX3Jvb3RfXyxcbiAgICAgICAgICBwYXRoOiBwYXRoR2VuZXJhdG9yKHRoaXMpLFxuICAgICAgICAgIHNpbGVudDogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fSxcblxuICAgIC8vIElmIG5vIG1vZGVscyBwYXNzZWQsIGltcGxpZXMgYW4gZW1wdHkgYXJyYXlcbiAgICBtb2RlbHMgfHwgKG1vZGVscyA9IFtdKTtcblxuICAgIC8vIElmIG1vZGVscyBpcyBhIHN0cmluZywgY2FsbCBzZXQgYXQgdGhhdCBwYXRoXG4gICAgaWYoXy5pc1N0cmluZyhtb2RlbHMpKSByZXR1cm4gdGhpcy5nZXQoJC5zcGxpdFBhdGgobW9kZWxzKVswXSkuc2V0KCQuc3BsaXRQYXRoKG1vZGVscykuc3BsaWNlKDEsIG1vZGVscy5sZW5ndGgpLmpvaW4oJy4nKSwgb3B0aW9ucyk7XG4gICAgaWYoIV8uaXNPYmplY3QobW9kZWxzKSkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0NvbGxlY3Rpb24uc2V0IG11c3QgYmUgcGFzc2VkIGEgTW9kZWwsIE9iamVjdCwgYXJyYXkgb3IgTW9kZWxzIGFuZCBPYmplY3RzLCBvciBhbm90aGVyIENvbGxlY3Rpb24nKTtcblxuICAgIC8vIElmIGFub3RoZXIgY29sbGVjdGlvbiwgdHJlYXQgbGlrZSBhbiBhcnJheVxuICAgIG1vZGVscyA9IChtb2RlbHMuaXNDb2xsZWN0aW9uKSA/IG1vZGVscy5tb2RlbHMgOiBtb2RlbHM7XG4gICAgLy8gRW5zdXJlIG1vZGVscyBpcyBhbiBhcnJheVxuICAgIG1vZGVscyA9ICghXy5pc0FycmF5KG1vZGVscykpID8gW21vZGVsc10gOiBtb2RlbHM7XG5cbiAgICAvLyBJZiB0aGUgbW9kZWwgYWxyZWFkeSBleGlzdHMgaW4gdGhpcyBjb2xsZWN0aW9uLCBvciB3ZSBhcmUgdG9sZCBub3QgdG8gY2xvbmUgaXQsIGxldCBCYWNrYm9uZSBoYW5kbGUgdGhlIG1lcmdlXG4gICAgLy8gT3RoZXJ3aXNlLCBjcmVhdGUgb3VyIGNvcHkgb2YgdGhpcyBtb2RlbCwgZ2l2ZSB0aGVtIHRoZSBzYW1lIGNpZCBzbyBvdXIgaGVscGVycyB0cmVhdCB0aGVtIGFzIHRoZSBzYW1lIG9iamVjdFxuICAgIF8uZWFjaChtb2RlbHMsIGZ1bmN0aW9uKGRhdGEsIGluZGV4KXtcbiAgICAgIGlmKGRhdGEuaXNNb2RlbCAmJiBvcHRpb25zLmNsb25lID09PSBmYWxzZSB8fCB0aGlzLl9ieUlkW2RhdGEuY2lkXSkgcmV0dXJuIG5ld01vZGVsc1tpbmRleF0gPSBkYXRhO1xuICAgICAgbmV3TW9kZWxzW2luZGV4XSA9IG5ldyB0aGlzLm1vZGVsKGRhdGEsIF8uZGVmYXVsdHMobGluZWFnZSwgb3B0aW9ucykpO1xuICAgICAgZGF0YS5pc01vZGVsICYmIChuZXdNb2RlbHNbaW5kZXhdLmNpZCA9IGRhdGEuY2lkKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoaXMgZWxlbWVudCBub3cga25vd3MgdGhhdCBpdCBoYXMgY2hpbGRyZW4gbm93LiBXaXRob3V0IHRoaXMgY3ljbGljIGRlcGVuZGFuY2llcyBjYXVzZSBpc3N1ZXNcbiAgICB0aGlzLl9oYXNBbmNlc3RyeSB8fCAodGhpcy5faGFzQW5jZXN0cnkgPSBuZXdNb2RlbHMubGVuZ3RoID4gMCk7XG5cbiAgICAvLyBDYWxsIG9yaWdpbmFsIHNldCBmdW5jdGlvbiB3aXRoIG1vZGVsIGR1cGxpY2F0ZXNcbiAgICByZXR1cm4gQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuc2V0LmNhbGwodGhpcywgbmV3TW9kZWxzLCBvcHRpb25zKTtcblxuICB9XG5cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBDb2xsZWN0aW9uO1xuIiwiLy8gUmVib3VuZCBQcmVjb21waWxlclxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgeyBjb21waWxlIGFzIGh0bWxiYXJzQ29tcGlsZSwgY29tcGlsZVNwZWMgYXMgaHRtbGJhcnNDb21waWxlU3BlYyB9IGZyb20gXCJodG1sYmFyc1wiO1xuXG4vLyBSZW1vdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjb21wb25lbnQncyBgc2NyaXB0YCB0YWcuXG5mdW5jdGlvbiBnZXRTY3JpcHQoc3RyKSB7XG4gIHJldHVybiBzdHIuaW5kZXhPZihcIjxzY3JpcHQ+XCIpID4gLTEgJiYgc3RyLmluZGV4T2YoXCI8L3NjcmlwdD5cIikgPiAtMSA/IFwiKGZ1bmN0aW9uKCl7XCIgKyBzdHIucmVwbGFjZSgvKFteXSo8c2NyaXB0PikoW15dKikoPFxcL3NjcmlwdD5bXl0qKS9pZywgXCIkMlwiKSArIFwifSkoKVwiIDogXCJ7fVwiO1xufVxuXG4vLyBSZW1vdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjb21wb25lbnQncyBgc3R5bGVgIHRhZy5cbmZ1bmN0aW9uIGdldFN0eWxlKHN0cikge1xuICByZXR1cm4gc3RyLmluZGV4T2YoXCI8c3R5bGU+XCIpID4gLTEgJiYgc3RyLmluZGV4T2YoXCI8L3N0eWxlPlwiKSA+IC0xID8gc3RyLnJlcGxhY2UoLyhbXl0qPHN0eWxlPikoW15dKikoPFxcL3N0eWxlPlteXSopL2lnLCBcIiQyXCIpLnJlcGxhY2UoL1wiL2csIFwiXFxcXFxcXCJcIikgOiBcIlwiO1xufVxuXG4vLyBSZW1vdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjb21wb25lbnQncyBgdGVtcGxhdGVgIHRhZy5cbmZ1bmN0aW9uIGdldFRlbXBsYXRlKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1teXSo8dGVtcGxhdGU+KFteXSopPFxcL3RlbXBsYXRlPlteXSovZ2ksIFwiJDFcIikucmVwbGFjZSgvKFteXSopPHN0eWxlPlteXSo8XFwvc3R5bGU+KFteXSopL2lnLCBcIiQxJDJcIik7XG59XG5cbi8vIEdldCB0aGUgY29tcG9uZW50J3MgbmFtZSBmcm9tIGl0cyBgbmFtZWAgYXR0cmlidXRlLlxuZnVuY3Rpb24gZ2V0TmFtZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXl0qPGVsZW1lbnRbXj5dKm5hbWU9KFtcIiddKT8oW14nXCI+XFxzXSspXFwxW148Pl0qPlteXSovaWcsIFwiJDJcIik7XG59XG5cbi8vIE1pbmlmeSB0aGUgc3RyaW5nIHBhc3NlZCBpbiBieSByZXBsYWNpbmcgYWxsIHdoaXRlc3BhY2UuXG5mdW5jdGlvbiBtaW5pZnkoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikucmVwbGFjZSgvXFxufCg+KSAoPCkvZywgXCIkMSQyXCIpO1xufVxuXG4vLyBTdHJpcCBqYXZhc2NyaXB0IGNvbW1lbnRzXG5mdW5jdGlvbiByZW1vdmVDb21tZW50cyhzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oPzpcXC9cXCooPzpbXFxzXFxTXSo/KVxcKlxcLyl8KD86KFtcXHNdKStcXC9cXC8oPzouKikkKS9nbSwgXCIkMVwiKTtcbn1cblxuZnVuY3Rpb24gdGVtcGxhdGVGdW5jKGZuKSB7XG4gIHZhciBzcmMgPSBmbi50b1N0cmluZygpO1xuICBzcmMgPSBzcmMuc2xpY2Uoc3JjLmluZGV4T2YoXCJ7XCIpICsgMSwgLTEpO1xuICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgIHJldHVybiAhZGF0YSA/IHNyYyA6IHNyYy5yZXBsYWNlKC8oXFwkW2EtekEtWl0rKS9nLCBmdW5jdGlvbigkcmVwKSB7XG4gICAgICB2YXIga2V5ID0gJHJlcC5zbGljZSgxKTtcbiAgICAgIHJldHVybiBkYXRhW2tleV0gfHwgXCJcIjtcbiAgICB9KTtcbiAgfTtcbn1cblxudmFyIENPTVBPTkVOVF9URU1QTEFURSA9IHRlbXBsYXRlRnVuYyhmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5SZWJvdW5kLnJlZ2lzdGVyQ29tcG9uZW50KFwiJG5hbWVcIiwge1xuICAgICAgcHJvdG90eXBlOiAkc2NyaXB0LFxuICAgICAgdGVtcGxhdGU6ICR0ZW1wbGF0ZSxcbiAgICAgIHN0eWxlOiBcIiRzdHlsZVwiXG4gICAgfSk7XG4gIH0pKCk7XG59KTtcblxuZnVuY3Rpb24gcHJlY29tcGlsZShzdHIsIG9wdGlvbnMpe1xuICBpZiggIXN0ciB8fCBzdHIubGVuZ3RoID09PSAwICl7XG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ05vIHRlbXBsYXRlIHByb3ZpZGVkIScpO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGNvbW1lbnRzXG4gIC8vIHN0ciA9IHJlbW92ZUNvbW1lbnRzKHN0cik7XG4gIC8vIE1pbmlmeSBldmVyeXRoaW5nXG4gIC8vIHN0ciA9IG1pbmlmeShzdHIpO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmJhc2VEZXN0ID0gb3B0aW9ucy5iYXNlRGVzdCB8fCAnJztcbiAgb3B0aW9ucy5uYW1lID0gb3B0aW9ucy5uYW1lIHx8ICcnO1xuICBvcHRpb25zLmJhc2VVcmwgPSBvcHRpb25zLmJhc2VVcmwgfHwgJyc7XG5cbiAgdmFyIHRlbXBsYXRlID0gc3RyLFxuICAgICAgc3R5bGUgPSAnJyxcbiAgICAgIHNjcmlwdCA9ICd7fScsXG4gICAgICBuYW1lID0gJycsXG4gICAgICBpc1BhcnRpYWwgPSB0cnVlLFxuICAgICAgaW1wb3J0cyA9IFtdLFxuICAgICAgcGFydGlhbHMsXG4gICAgICByZXF1aXJlLFxuICAgICAgZGVwcyA9IFtdO1xuXG4gIC8vIElmIHRoZSBlbGVtZW50IHRhZyBpcyBwcmVzZW50XG4gIGlmKHN0ci5pbmRleE9mKCc8ZWxlbWVudCcpID4gLTEgJiYgc3RyLmluZGV4T2YoJzwvZWxlbWVudD4nKSA+IC0xKXtcblxuICAgIGlzUGFydGlhbCA9IGZhbHNlO1xuXG4gICAgbmFtZSA9IGdldE5hbWUoc3RyKTtcbiAgICBzdHlsZSA9IGdldFN0eWxlKHN0cik7XG4gICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZShzdHIpO1xuICAgIHNjcmlwdCA9IGdldFNjcmlwdChzdHIpO1xuXG4gIH1cblxuXG4gIC8vIEFzc2VtcGxlIG91ciBjb21wb25lbnQgZGVwZW5kYW5jaWVzIGJ5IGZpbmRpbmcgbGluayB0YWdzIGFuZCBwYXJzaW5nIHRoZWlyIHNyY1xuICB2YXIgaW1wb3J0c3JlID0gLzxsaW5rIFteaF0qaHJlZj0oWydcIl0/KVxcLz8oW14uJ1wiXSopLmh0bWxcXDFbXj5dKj4vZ2ksXG4gICAgICBtYXRjaDtcblxuICB3aGlsZSAoKG1hdGNoID0gaW1wb3J0c3JlLmV4ZWModGVtcGxhdGUpKSAhPSBudWxsKSB7XG4gICAgICBpbXBvcnRzLnB1c2gobWF0Y2hbMl0pO1xuICB9XG4gIGltcG9ydHMuZm9yRWFjaChmdW5jdGlvbihpbXBvcnRTdHJpbmcsIGluZGV4KXtcbiAgICBkZXBzLnB1c2goJ1wiJyArIG9wdGlvbnMuYmFzZURlc3QgKyBpbXBvcnRTdHJpbmcgKyAnXCInKTtcbiAgfSk7XG5cbiAgLy8gUmVtb3ZlIGxpbmsgdGFncyBmcm9tIHRlbXBsYXRlXG4gIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZSgvPGxpbmsgLipocmVmPShbJ1wiXT8pKC4qKS5odG1sXFwxW14+XSo+L2dpLCAnJyk7XG5cbiAgLy8gQXNzZW1ibGUgb3VyIHBhcnRpYWwgZGVwZW5kYW5jaWVzXG4gIHBhcnRpYWxzID0gdGVtcGxhdGUubWF0Y2goL1xce1xcez5cXHMqP1snXCJdPyhbXidcIn1cXHNdKilbJ1wiXT9cXHMqP1xcfVxcfS9naSk7XG5cbiAgaWYocGFydGlhbHMpe1xuICAgIHBhcnRpYWxzLmZvckVhY2goZnVuY3Rpb24ocGFydGlhbCwgaW5kZXgpe1xuICAgICAgZGVwcy5wdXNoKCdcIicgKyBvcHRpb25zLmJhc2VEZXN0ICsgcGFydGlhbC5yZXBsYWNlKC9cXHtcXHs+W1xccypdP1snXCJdPyhbXidcIl0qKVsnXCJdP1tcXHMqXT9cXH1cXH0vZ2ksICckMScpICsgJ1wiJyk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBDb21waWxlXG4gIHRlbXBsYXRlID0gJycgKyBodG1sYmFyc0NvbXBpbGVTcGVjKHRlbXBsYXRlKTtcblxuICAvLyBJZiBpcyBhIHBhcnRpYWxcbiAgaWYoaXNQYXJ0aWFsKXtcbiAgICB0ZW1wbGF0ZSA9ICcoZnVuY3Rpb24oKXt2YXIgdGVtcGxhdGUgPSAnK3RlbXBsYXRlKydcXG4gd2luZG93LlJlYm91bmQucmVnaXN0ZXJQYXJ0aWFsKCBcIicrIG9wdGlvbnMubmFtZSArJ1wiLCB0ZW1wbGF0ZSk7fSkoKTtcXG4nO1xuICB9XG4gIC8vIEVsc2UsIGlzIGEgY29tcG9uZW50XG4gIGVsc2V7XG4gICAgdGVtcGxhdGUgPSBDT01QT05FTlRfVEVNUExBVEUoe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIHNjcmlwdDogc2NyaXB0LFxuICAgICAgc3R5bGU6IHN0eWxlLFxuICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlXG4gICAgfSk7XG4gIH1cblxuICAvLyBXcmFwIGluIGRlZmluZVxuICB0ZW1wbGF0ZSA9IFwiZGVmaW5lKCBbXCIrIGRlcHMuam9pbignLCAnKSAgK1wiXSwgZnVuY3Rpb24oKXtcXG5cIiArIHRlbXBsYXRlICsgJ30pOyc7XG5cbiAgcmV0dXJuIHRlbXBsYXRlO1xufVxuXG5leHBvcnQgeyBwcmVjb21waWxlIH07XG4iLCIvLyBSZWJvdW5kIFJvdXRlclxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuLy8gSWYgQmFja2JvbmUgaGFzbid0IGJlZW4gc3RhcnRlZCB5ZXQsIHRocm93IGVycm9yXG5pZighd2luZG93LkJhY2tib25lKXsgdGhyb3cgXCJCYWNrYm9uZSBtdXN0IGJlIG9uIHRoZSBwYWdlIGZvciBSZWJvdW5kIHRvIGxvYWQuXCI7IH1cblxuICAvLyBDbGVhbiB1cCBvbGQgcGFnZSBjb21wb25lbnQgYW5kIGxvYWQgcm91dGVzIGZyb20gb3VyIG5ldyBwYWdlIGNvbXBvbmVudFxuICBmdW5jdGlvbiBpbnN0YWxsUmVzb3VyY2VzKFBhZ2VBcHAsIHByaW1hcnlSb3V0ZSwgaXNHbG9iYWwpIHtcbiAgICB2YXIgb2xkUGFnZU5hbWUsIHBhZ2VJbnN0YW5jZSwgY29udGFpbmVyLCByb3V0ZXIgPSB0aGlzO1xuXG4gICAgLy8gRGUtaW5pdGlhbGl6ZSB0aGUgcHJldmlvdXMgYXBwIGJlZm9yZSByZW5kZXJpbmcgYSBuZXcgYXBwXG4gICAgLy8gVGhpcyB3YXkgd2UgY2FuIGVuc3VyZSB0aGF0IGV2ZXJ5IG5ldyBwYWdlIHN0YXJ0cyB3aXRoIGEgY2xlYW4gc2xhdGVcbiAgICAvLyBUaGlzIGlzIGNydWNpYWwgZm9yIHNjYWxhYmlsaXR5IG9mIGEgc2luZ2xlIHBhZ2UgYXBwLlxuICAgIGlmKCFpc0dsb2JhbCAmJiB0aGlzLmN1cnJlbnQpe1xuXG4gICAgICBvbGRQYWdlTmFtZSA9IHRoaXMuY3VycmVudC5fX25hbWU7XG4gICAgICAvLyBVbnNldCBQcmV2aW91cyBBcHBsaWNhdGlvbidzIFJvdXRlcy4gRm9yIGVhY2ggcm91dGUgaW4gdGhlIHBhZ2UgYXBwOlxuICAgICAgXy5lYWNoKHRoaXMuY3VycmVudC5fX2NvbXBvbmVudF9fLnJvdXRlcywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcblxuICAgICAgICB2YXIgcmVnRXhwID0gcm91dGVyLl9yb3V0ZVRvUmVnRXhwKGtleSkudG9TdHJpbmcoKTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIGhhbmRsZXIgZnJvbSBvdXIgcm91dGUgb2JqZWN0XG4gICAgICAgIEJhY2tib25lLmhpc3RvcnkuaGFuZGxlcnMgPSBfLmZpbHRlcihCYWNrYm9uZS5oaXN0b3J5LmhhbmRsZXJzLCBmdW5jdGlvbihvYmope3JldHVybiBvYmoucm91dGUudG9TdHJpbmcoKSAhPT0gcmVnRXhwO30pO1xuXG4gICAgICAgIC8vIERlbGV0ZSBvdXIgcmVmZXJhbmNlIHRvIHRoZSByb3V0ZSdzIGNhbGxiYWNrXG4gICAgICAgIGRlbGV0ZSByb3V0ZXJbICdfZnVuY3Rpb25fJyArIGtleSBdO1xuXG4gICAgICB9KTtcblxuICAgICAgLy8gVW4taG9vayBFdmVudCBCaW5kaW5ncywgRGVsZXRlIE9iamVjdHNcbiAgICAgIHRoaXMuY3VycmVudC5fX2NvbXBvbmVudF9fLmRlaW5pdGlhbGl6ZSgpO1xuXG4gICAgICAvLyBEaXNhYmxlIG9sZCBjc3MgaWYgaXQgZXhpc3RzXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9sZFBhZ2VOYW1lICsgJy1jc3MnKS5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICB9LCA1MDApO1xuXG4gICAgfVxuXG4gICAgLy8gTG9hZCBOZXcgUGFnZUFwcCwgZ2l2ZSBpdCBpdCdzIG5hbWUgc28gd2Uga25vdyB3aGF0IGNzcyB0byByZW1vdmUgd2hlbiBpdCBkZWluaXRpYWxpemVzXG4gICAgcGFnZUluc3RhbmNlID0gbmV3IFBhZ2VBcHAoKTtcbiAgICBwYWdlSW5zdGFuY2UuX19uYW1lID0gcHJpbWFyeVJvdXRlO1xuXG4gICAgLy8gQWRkIHRvIG91ciBwYWdlXG4gICAgY29udGFpbmVyID0gKGlzR2xvYmFsKSA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaXNHbG9iYWwpIDogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvbnRlbnQnKVswXTtcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHBhZ2VJbnN0YW5jZSk7XG5cbiAgICAvLyBNYWtlIHN1cmUgd2UncmUgYmFjayBhdCB0aGUgdG9wIG9mIHRoZSBwYWdlXG4gICAgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgPSAwO1xuXG4gICAgLy8gQXVnbWVudCBBcHBsaWNhdGlvblJvdXRlciB3aXRoIG5ldyByb3V0ZXMgZnJvbSBQYWdlQXBwXG4gICAgXy5lYWNoKHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fLnJvdXRlcywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIC8vIEdlbmVyYXRlIG91ciByb3V0ZSBjYWxsYmFjaydzIG5ldyBuYW1lXG4gICAgICB2YXIgcm91dGVGdW5jdGlvbk5hbWUgPSAnX2Z1bmN0aW9uXycgKyBrZXksXG4gICAgICAgICAgZnVuY3Rpb25OYW1lO1xuICAgICAgLy8gQWRkIHRoZSBuZXcgY2FsbGJhY2sgcmVmZXJhbmNlIG9uIHRvIG91ciByb3V0ZXJcbiAgICAgIHJvdXRlcltyb3V0ZUZ1bmN0aW9uTmFtZV0gPSAgZnVuY3Rpb24gKCkgeyBwYWdlSW5zdGFuY2UuX19jb21wb25lbnRfX1t2YWx1ZV0uYXBwbHkocGFnZUluc3RhbmNlLl9fY29tcG9uZW50X18sIGFyZ3VtZW50cyk7IH07XG4gICAgICAvLyBBZGQgdGhlIHJvdXRlIGhhbmRsZXJcbiAgICAgIHJvdXRlci5yb3V0ZShrZXksIHZhbHVlLCB0aGlzW3JvdXRlRnVuY3Rpb25OYW1lXSk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBpZighaXNHbG9iYWwpe1xuICAgICAgd2luZG93LlJlYm91bmQuc2VydmljZXMucGFnZSA9ICh0aGlzLmN1cnJlbnQgPSBwYWdlSW5zdGFuY2UpLl9fY29tcG9uZW50X187XG4gICAgfSBlbHNle1xuICAgICAgd2luZG93LlJlYm91bmQuc2VydmljZXNbcGFnZUluc3RhbmNlLl9fbmFtZV0gPSBwYWdlSW5zdGFuY2UuX19jb21wb25lbnRfXztcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gb3VyIG5ld2x5IGluc3RhbGxlZCBhcHBcbiAgICByZXR1cm4gcGFnZUluc3RhbmNlO1xuICB9XG5cbiAgLy8gRmV0Y2hlcyBQYXJlIEhUTUwgYW5kIENTU1xuICBmdW5jdGlvbiBmZXRjaFJlc291cmNlcyhhcHBOYW1lLCBwcmltYXJ5Um91dGUsIGlzR2xvYmFsKSB7XG5cbiAgICAvLyBFeHBlY3RpbmcgTW9kdWxlIERlZmluaXRpb24gYXMgJ1NlYXJjaEFwcCcgV2hlcmUgJ1NlYXJjaCcgYSBQcmltYXJ5IFJvdXRlXG4gICAgdmFyIGpzVXJsID0gdGhpcy5jb25maWcuanNQYXRoLnJlcGxhY2UoLzpyb3V0ZS9nLCBwcmltYXJ5Um91dGUpLnJlcGxhY2UoLzphcHAvZywgYXBwTmFtZSksXG4gICAgICAgIGNzc1VybCA9IHRoaXMuY29uZmlnLmNzc1BhdGgucmVwbGFjZSgvOnJvdXRlL2csIHByaW1hcnlSb3V0ZSkucmVwbGFjZSgvOmFwcC9nLCBhcHBOYW1lKSxcbiAgICAgICAgY3NzTG9hZGVkID0gZmFsc2UsXG4gICAgICAgIGpzTG9hZGVkID0gZmFsc2UsXG4gICAgICAgIGNzc0VsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcHBOYW1lICsgJy1jc3MnKSxcbiAgICAgICAganNFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXBwTmFtZSArICctanMnKSxcbiAgICAgICAgcm91dGVyID0gdGhpcyxcbiAgICAgICAgUGFnZUFwcDtcblxuICAgICAgLy8gT25seSBMb2FkIENTUyBJZiBOb3QgTG9hZGVkIEJlZm9yZVxuICAgICAgaWYoY3NzRWxlbWVudCA9PT0gbnVsbCl7XG4gICAgICAgIGNzc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgICAgIGNzc0VsZW1lbnQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgICAgIGNzc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgnaHJlZicsIGNzc1VybCk7XG4gICAgICAgIGNzc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdpZCcsIGFwcE5hbWUgKyAnLWNzcycpO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGNzc0VsZW1lbnQpO1xuICAgICAgICAkKGNzc0VsZW1lbnQpLm9uKCdsb2FkJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgaWYoKGNzc0xvYWRlZCA9IHRydWUpICYmIGpzTG9hZGVkKXtcbiAgICAgICAgICAgICAgLy8gSW5zdGFsbCBUaGUgTG9hZGVkIFJlc291cmNlc1xuICAgICAgICAgICAgICBpbnN0YWxsUmVzb3VyY2VzLmNhbGwocm91dGVyLCBQYWdlQXBwLCBhcHBOYW1lLCBpc0dsb2JhbCk7XG5cbiAgICAgICAgICAgICAgLy8gUmUtdHJpZ2dlciByb3V0ZSBzbyB0aGUgbmV3bHkgYWRkZWQgcm91dGUgbWF5IGV4ZWN1dGUgaWYgdGhlcmUncyBhIHJvdXRlIG1hdGNoLlxuICAgICAgICAgICAgICAvLyBJZiBubyByb3V0ZXMgYXJlIG1hdGNoZWQsIGFwcCB3aWxsIGhpdCB3aWxkQ2FyZCByb3V0ZSB3aGljaCB3aWxsIHRoZW4gdHJpZ2dlciA0MDRcbiAgICAgICAgICAgICAgaWYoIWlzR2xvYmFsICYmIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkKXtcbiAgICAgICAgICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LmxvYWRVcmwoQmFja2JvbmUuaGlzdG9yeS5mcmFnbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYoIWlzR2xvYmFsKXtcbiAgICAgICAgICAgICAgICByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyBJZiBpdCBoYXMgYmVlbiBsb2FkZWQgYmV2b3JlLCBlbmFibGUgaXRcbiAgICAgIGVsc2Uge1xuICAgICAgICBjc3NFbGVtZW50ICYmIGNzc0VsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgICAgICBjc3NMb2FkZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBpZiByZXF1aXJlanMgaXMgbm90IG9uIHRoZSBwYWdlLCBsb2FkIHRoZSBmaWxlIG1hbnVhbGx5LiBJdCBiZXR0ZXIgY29udGFpbiBhbGwgaXRzIGRlcGVuZGFuY2llcy5cbiAgICAgIGlmKHdpbmRvdy5yZXF1aXJlLl9kZWZpbmVkIHx8IF8uaXNVbmRlZmluZWQod2luZG93LnJlcXVpcmUpKXtcbiAgICAgICAgICBqc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICBqc0VsZW1lbnQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvamF2YXNjcmlwdCcpO1xuICAgICAgICAgIGpzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3NyYycsICcvJytqc1VybCsnLmpzJyk7XG4gICAgICAgICAganNFbGVtZW50LnNldEF0dHJpYnV0ZSgnaWQnLCBhcHBOYW1lICsgJy1qcycpO1xuICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoanNFbGVtZW50KTtcbiAgICAgICAgICAkKGpzRWxlbWVudCkub24oJ2xvYWQnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAvLyBBTUQgV2lsbCBNYW5hZ2UgRGVwZW5kYW5jaWVzIEZvciBVcy4gTG9hZCBUaGUgQXBwLlxuICAgICAgICAgICAgcmVxdWlyZShbanNVcmxdLCBmdW5jdGlvbihQYWdlQ2xhc3Mpe1xuXG4gICAgICAgICAgICAgIGlmKChqc0xvYWRlZCA9IHRydWUpICYmIChQYWdlQXBwID0gUGFnZUNsYXNzKSAmJiBjc3NMb2FkZWQpe1xuXG4gICAgICAgICAgICAgICAgLy8gSW5zdGFsbCBUaGUgTG9hZGVkIFJlc291cmNlc1xuICAgICAgICAgICAgICAgIGluc3RhbGxSZXNvdXJjZXMuY2FsbChyb3V0ZXIsIFBhZ2VBcHAsIGFwcE5hbWUsIGlzR2xvYmFsKTtcbiAgICAgICAgICAgICAgICAvLyBSZS10cmlnZ2VyIHJvdXRlIHNvIHRoZSBuZXdseSBhZGRlZCByb3V0ZSBtYXkgZXhlY3V0ZSBpZiB0aGVyZSdzIGEgcm91dGUgbWF0Y2guXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gcm91dGVzIGFyZSBtYXRjaGVkLCBhcHAgd2lsbCBoaXQgd2lsZENhcmQgcm91dGUgd2hpY2ggd2lsbCB0aGVuIHRyaWdnZXIgNDA0XG4gICAgICAgICAgICAgICAgaWYoIWlzR2xvYmFsICYmIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkKXtcbiAgICAgICAgICAgICAgICAgIEJhY2tib25lLmhpc3RvcnkubG9hZFVybChCYWNrYm9uZS5oaXN0b3J5LmZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoIWlzR2xvYmFsKXtcbiAgICAgICAgICAgICAgICAgIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIC8vIEFNRCBXaWxsIE1hbmFnZSBEZXBlbmRhbmNpZXMgRm9yIFVzLiBMb2FkIFRoZSBBcHAuXG4gICAgICAgIHdpbmRvdy5yZXF1aXJlKFtqc1VybF0sIGZ1bmN0aW9uKFBhZ2VDbGFzcyl7XG5cbiAgICAgICAgICBpZigoanNMb2FkZWQgPSB0cnVlKSAmJiAoUGFnZUFwcCA9IFBhZ2VDbGFzcykgJiYgY3NzTG9hZGVkKXtcblxuICAgICAgICAgICAgLy8gSW5zdGFsbCBUaGUgTG9hZGVkIFJlc291cmNlc1xuICAgICAgICAgICAgaW5zdGFsbFJlc291cmNlcy5jYWxsKHJvdXRlciwgUGFnZUFwcCwgYXBwTmFtZSwgaXNHbG9iYWwpO1xuICAgICAgICAgICAgLy8gUmUtdHJpZ2dlciByb3V0ZSBzbyB0aGUgbmV3bHkgYWRkZWQgcm91dGUgbWF5IGV4ZWN1dGUgaWYgdGhlcmUncyBhIHJvdXRlIG1hdGNoLlxuICAgICAgICAgICAgLy8gSWYgbm8gcm91dGVzIGFyZSBtYXRjaGVkLCBhcHAgd2lsbCBoaXQgd2lsZENhcmQgcm91dGUgd2hpY2ggd2lsbCB0aGVuIHRyaWdnZXIgNDA0XG4gICAgICAgICAgICBpZighaXNHbG9iYWwgJiYgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQpe1xuICAgICAgICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LmxvYWRVcmwoQmFja2JvbmUuaGlzdG9yeS5mcmFnbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICAgICAgICAgIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgfVxuXG4gIC8vIFJlYm91bmRSb3V0ZXIgQ29uc3RydWN0b3JcbiAgdmFyIFJlYm91bmRSb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcblxuICAgIHJvdXRlczoge1xuICAgICAgJypyb3V0ZSc6ICd3aWxkY2FyZFJvdXRlJ1xuICAgIH0sXG5cbiAgICAvLyBDYWxsZWQgd2hlbiBubyBtYXRjaGluZyByb3V0ZXMgYXJlIGZvdW5kLiBFeHRyYWN0cyByb290IHJvdXRlIGFuZCBmZXRjaGVzIGl0IHJlc291cmNlc1xuICAgIHdpbGRjYXJkUm91dGU6IGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICB2YXIgYXBwTmFtZSwgcHJpbWFyeVJvdXRlO1xuXG4gICAgICAvLyBJZiBlbXB0eSByb3V0ZSBzZW50LCByb3V0ZSBob21lXG4gICAgICByb3V0ZSA9IHJvdXRlIHx8ICcnO1xuXG4gICAgICAvLyBHZXQgUm9vdCBvZiBSb3V0ZVxuICAgICAgYXBwTmFtZSA9IHByaW1hcnlSb3V0ZSA9IChyb3V0ZSkgPyByb3V0ZS5zcGxpdCgnLycpWzBdIDogJ2luZGV4JztcblxuICAgICAgLy8gRmluZCBBbnkgQ3VzdG9tIFJvdXRlIE1hcHBpbmdzXG4gICAgICBfLmFueSh0aGlzLmNvbmZpZy5oYW5kbGVycywgZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgICBpZiAoaGFuZGxlci5yb3V0ZS50ZXN0KHJvdXRlKSkge1xuICAgICAgICAgIGFwcE5hbWUgPSBoYW5kbGVyLnByaW1hcnlSb3V0ZTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIElmIFBhZ2UgSXMgQWxyZWFkeSBMb2FkZWQgVGhlbiBUaGUgUm91dGUgRG9lcyBOb3QgRXhpc3QuIDQwNCBhbmQgRXhpdC5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnQgJiYgdGhpcy5jdXJyZW50Lm5hbWUgPT09IHByaW1hcnlSb3V0ZSkge1xuICAgICAgICByZXR1cm4gQmFja2JvbmUuaGlzdG9yeS5sb2FkVXJsKCc0MDQnKTtcbiAgICAgIH1cblxuICAgICAgLy8gRmV0Y2ggUmVzb3VyY2VzXG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoXCJsb2FkaW5nXCIpO1xuICAgICAgZmV0Y2hSZXNvdXJjZXMuY2FsbCh0aGlzLCBhcHBOYW1lLCBwcmltYXJ5Um91dGUpO1xuICAgIH0sXG5cbiAgICAvLyBPbiBzdGFydHVwLCBzYXZlIG91ciBjb25maWcgb2JqZWN0IGFuZCBzdGFydCB0aGUgcm91dGVyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuXG4gICAgICAvLyBTYXZlIG91ciBjb25maWcgcmVmZXJhbmNlXG4gICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgdGhpcy5jb25maWcuaGFuZGxlcnMgPSBbXTtcblxuICAgICAgdmFyIHJlbW90ZVVybCA9IC9eKFthLXpdKzopfF4oXFwvXFwvKXxeKFteXFwvXStcXC4pLyxcblxuICAgICAgcm91dGVyID0gdGhpcztcblxuICAgICAgLy8gQ29udmVydCBvdXIgcm91dGVNYXBwaW5ncyB0byByZWdleHBzIGFuZCBwdXNoIHRvIG91ciBoYW5kbGVyc1xuICAgICAgXy5lYWNoKHRoaXMuY29uZmlnLnJvdXRlTWFwcGluZywgZnVuY3Rpb24odmFsdWUsIHJvdXRlKXtcbiAgICAgICAgaWYgKCFfLmlzUmVnRXhwKHJvdXRlKSkgcm91dGUgPSByb3V0ZXIuX3JvdXRlVG9SZWdFeHAocm91dGUpO1xuICAgICAgICByb3V0ZXIuY29uZmlnLmhhbmRsZXJzLnVuc2hpZnQoeyByb3V0ZTogcm91dGUsIHByaW1hcnlSb3V0ZTogdmFsdWUgfSk7XG4gICAgICB9LCB0aGlzKTtcblxuICAgICAgLy8gTmF2aWdhdGUgdG8gcm91dGUgZm9yIGFueSBsaW5rIHdpdGggYSByZWxhdGl2ZSBocmVmXG4gICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uKGUpe1xuXG4gICAgICAgIHZhciBwYXRoID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cbiAgICAgICAgLy8gSWYgcGF0aCBpcyBub3QgYW4gcmVtb3RlIHVybCwgZW5kcyBpbiAuW2Etel0sIG9yIGJsYW5rLCB0cnkgYW5kIG5hdmlnYXRlIHRvIHRoYXQgcm91dGUuXG4gICAgICAgIGlmKCBwYXRoICYmIHBhdGggIT09ICcjJyAmJiAhcmVtb3RlVXJsLnRlc3QocGF0aCkgKXtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYocGF0aCAhPT0gJy8nK0JhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQpICQoZG9jdW1lbnQpLnVuTWFya0xpbmtzKCk7XG4gICAgICAgICAgcm91dGVyLm5hdmlnYXRlKHBhdGgsIHt0cmlnZ2VyOiB0cnVlfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBCYWNrYm9uZS5oaXN0b3J5Lm9uKCdyb3V0ZScsIGZ1bmN0aW9uKHJvdXRlLCBwYXJhbXMpe1xuICAgICAgICAkKGRvY3VtZW50KS5tYXJrTGlua3MoKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBJbnN0YWxsIG91ciBnbG9iYWwgY29tcG9uZW50c1xuICAgICAgXy5lYWNoKHRoaXMuY29uZmlnLmdsb2JhbENvbXBvbmVudHMsIGZ1bmN0aW9uKHNlbGVjdG9yLCByb3V0ZSl7XG4gICAgICAgIGZldGNoUmVzb3VyY2VzLmNhbGwocm91dGVyLCByb3V0ZSwgcm91dGUsIHNlbGVjdG9yKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBMZXQgYWxsIG9mIG91ciBjb21wb25lbnRzIGFsd2F5cyBoYXZlIHJlZmVyYW5jZSB0byBvdXIgcm91dGVyXG4gICAgICBSZWJvdW5kLkNvbXBvbmVudC5wcm90b3R5cGUucm91dGVyID0gdGhpcztcblxuICAgICAgLy8gU3RhcnQgdGhlIGhpc3RvcnlcbiAgICAgIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoe1xuICAgICAgICBwdXNoU3RhdGU6IHRydWUsXG4gICAgICAgIHJvb3Q6IHRoaXMuY29uZmlnLnJvb3RcbiAgICAgIH0pO1xuXG4gICAgfVxuICB9KTtcblxuZXhwb3J0IGRlZmF1bHQgUmVib3VuZFJvdXRlcjtcbiIsIi8vICAgICBSZWJvdW5kLmpzIDAuMC42MFxuXG4vLyAgICAgKGMpIDIwMTUgQWRhbSBNaWxsZXJcbi8vICAgICBSZWJvdW5kIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuLy8gICAgIEZvciBhbGwgZGV0YWlscyBhbmQgZG9jdW1lbnRhdGlvbjpcbi8vICAgICBodHRwOi8vcmVib3VuZGpzLmNvbVxuXG4vLyBSZWJvdW5kIFJ1bnRpbWVcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuLy8gSWYgQmFja2JvbmUgaXNuJ3QgcHJlc2V0IG9uIHRoZSBwYWdlIHlldCwgb3IgaWYgYHdpbmRvdy5SZWJvdW5kYCBpcyBhbHJlYWR5XG4vLyBpbiB1c2UsIHRocm93IGFuIGVycm9yXG5pZighd2luZG93LkJhY2tib25lKSB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjtcbmlmKCF3aW5kb3cuUmVib3VuZCkgdGhyb3cgXCJHbG9iYWwgUmVib3VuZCBuYW1lc3BhY2UgYWxyZWFkeSB0YWtlbi5cIjtcblxuLy8gTG9hZCBvdXIgKipVdGlscyoqLCBoZWxwZXIgZW52aXJvbm1lbnQsICoqUmVib3VuZCBEYXRhKiosXG4vLyAqKlJlYm91bmQgQ29tcG9uZW50cyoqIGFuZCB0aGUgKipSZWJvdW5kIFJvdXRlcioqXG5pbXBvcnQgdXRpbHMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuaW1wb3J0IHsgTW9kZWwsIENvbGxlY3Rpb24sIENvbXB1dGVkUHJvcGVydHkgfSBmcm9tIFwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YVwiO1xuaW1wb3J0IENvbXBvbmVudCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50XCI7XG5pbXBvcnQgUm91dGVyIGZyb20gXCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlclwiO1xuXG4vLyBJZiBCYWNrYm9uZSBkb2Vzbid0IGhhdmUgYW4gYWpheCBtZXRob2QgZnJvbSBhbiBleHRlcm5hbCBET00gbGlicmFyeSwgdXNlIG91cnNcbndpbmRvdy5CYWNrYm9uZS5hamF4ID0gd2luZG93LkJhY2tib25lLiQgJiYgd2luZG93LkJhY2tib25lLiQuYWpheCAmJiB3aW5kb3cuQmFja2JvbmUuYWpheCB8fCB1dGlscy5hamF4O1xuXG4vLyBGZXRjaCBSZWJvdW5kJ3MgQ29uZmlnIE9iamVjdCBmcm9tIFJlYm91bmQncyBgc2NyaXB0YCB0YWdcbnZhciBDb25maWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnUmVib3VuZCcpLmlubmVySFRNTDtcblxuLy8gQ3JlYXRlIEdsb2JhbCBSZWJvdW5kIE9iamVjdFxud2luZG93LlJlYm91bmQgPSB7XG4gIHNlcnZpY2VzOiB7fSxcbiAgcmVnaXN0ZXJIZWxwZXI6IGhlbHBlcnMucmVnaXN0ZXJIZWxwZXIsXG4gIHJlZ2lzdGVyUGFydGlhbDogaGVscGVycy5yZWdpc3RlclBhcnRpYWwsXG4gIHJlZ2lzdGVyQ29tcG9uZW50OiBDb21wb25lbnQucmVnaXN0ZXIsXG4gIE1vZGVsOiBNb2RlbCxcbiAgQ29sbGVjdGlvbjogQ29sbGVjdGlvbixcbiAgQ29tcHV0ZWRQcm9wZXJ0eTogQ29tcHV0ZWRQcm9wZXJ0eSxcbiAgQ29tcG9uZW50OiBDb21wb25lbnRcbn07XG5cbi8vIFN0YXJ0IHRoZSByb3V0ZXIgaWYgYSBjb25maWcgb2JqZWN0IGlzIHByZXNldFxuaWYoQ29uZmlnKSB3aW5kb3cuUmVib3VuZC5yb3V0ZXIgPSBuZXcgUm91dGVyKHtjb25maWc6IEpTT04ucGFyc2UoQ29uZmlnKX0pO1xuXG5leHBvcnQgZGVmYXVsdCBSZWJvdW5kO1xuIiwiLypqc2hpbnQgLVcwNTQgKi9cbi8vIGpzaGludCBpZ25vcmU6IHN0YXJ0XG5cbiAgLy8gQSBzZWNvbmQgb3B0aW9uYWwgYXJndW1lbnQgY2FuIGJlIGdpdmVuIHRvIGZ1cnRoZXIgY29uZmlndXJlXG4gIC8vIHRoZSBwYXJzZXIgcHJvY2Vzcy4gVGhlc2Ugb3B0aW9ucyBhcmUgcmVjb2duaXplZDpcblxuICB2YXIgZXhwb3J0cyA9IHt9O1xuXG4gIHZhciBvcHRpb25zLCBpbnB1dCwgaW5wdXRMZW4sIHNvdXJjZUZpbGU7XG5cbiAgdmFyIGRlZmF1bHRPcHRpb25zID0gZXhwb3J0cy5kZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAvLyBgZWNtYVZlcnNpb25gIGluZGljYXRlcyB0aGUgRUNNQVNjcmlwdCB2ZXJzaW9uIHRvIHBhcnNlLiBNdXN0XG4gICAgLy8gYmUgZWl0aGVyIDMsIG9yIDUsIG9yIDYuIFRoaXMgaW5mbHVlbmNlcyBzdXBwb3J0IGZvciBzdHJpY3RcbiAgICAvLyBtb2RlLCB0aGUgc2V0IG9mIHJlc2VydmVkIHdvcmRzLCBzdXBwb3J0IGZvciBnZXR0ZXJzIGFuZFxuICAgIC8vIHNldHRlcnMgYW5kIG90aGVyIGZlYXR1cmVzLiBFUzYgc3VwcG9ydCBpcyBvbmx5IHBhcnRpYWwuXG4gICAgZWNtYVZlcnNpb246IDUsXG4gICAgLy8gVHVybiBvbiBgc3RyaWN0U2VtaWNvbG9uc2AgdG8gcHJldmVudCB0aGUgcGFyc2VyIGZyb20gZG9pbmdcbiAgICAvLyBhdXRvbWF0aWMgc2VtaWNvbG9uIGluc2VydGlvbi5cbiAgICBzdHJpY3RTZW1pY29sb25zOiBmYWxzZSxcbiAgICAvLyBXaGVuIGBhbGxvd1RyYWlsaW5nQ29tbWFzYCBpcyBmYWxzZSwgdGhlIHBhcnNlciB3aWxsIG5vdCBhbGxvd1xuICAgIC8vIHRyYWlsaW5nIGNvbW1hcyBpbiBhcnJheSBhbmQgb2JqZWN0IGxpdGVyYWxzLlxuICAgIGFsbG93VHJhaWxpbmdDb21tYXM6IHRydWUsXG4gICAgLy8gQnkgZGVmYXVsdCwgcmVzZXJ2ZWQgd29yZHMgYXJlIG5vdCBlbmZvcmNlZC4gRW5hYmxlXG4gICAgLy8gYGZvcmJpZFJlc2VydmVkYCB0byBlbmZvcmNlIHRoZW0uIFdoZW4gdGhpcyBvcHRpb24gaGFzIHRoZVxuICAgIC8vIHZhbHVlIFwiZXZlcnl3aGVyZVwiLCByZXNlcnZlZCB3b3JkcyBhbmQga2V5d29yZHMgY2FuIGFsc28gbm90IGJlXG4gICAgLy8gdXNlZCBhcyBwcm9wZXJ0eSBuYW1lcy5cbiAgICBmb3JiaWRSZXNlcnZlZDogZmFsc2UsXG4gICAgLy8gV2hlbiBlbmFibGVkLCBhIHJldHVybiBhdCB0aGUgdG9wIGxldmVsIGlzIG5vdCBjb25zaWRlcmVkIGFuXG4gICAgLy8gZXJyb3IuXG4gICAgYWxsb3dSZXR1cm5PdXRzaWRlRnVuY3Rpb246IGZhbHNlLFxuICAgIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIGBsb2NgIHByb3BlcnRpZXMgaG9sZGluZyBvYmplY3RzIHdpdGhcbiAgICAvLyBgc3RhcnRgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzIGluIGB7bGluZSwgY29sdW1ufWAgZm9ybSAod2l0aFxuICAgIC8vIGxpbmUgYmVpbmcgMS1iYXNlZCBhbmQgY29sdW1uIDAtYmFzZWQpIHdpbGwgYmUgYXR0YWNoZWQgdG8gdGhlXG4gICAgLy8gbm9kZXMuXG4gICAgbG9jYXRpb25zOiBmYWxzZSxcbiAgICAvLyBBIGZ1bmN0aW9uIGNhbiBiZSBwYXNzZWQgYXMgYG9uQ29tbWVudGAgb3B0aW9uLCB3aGljaCB3aWxsXG4gICAgLy8gY2F1c2UgQWNvcm4gdG8gY2FsbCB0aGF0IGZ1bmN0aW9uIHdpdGggYChibG9jaywgdGV4dCwgc3RhcnQsXG4gICAgLy8gZW5kKWAgcGFyYW1ldGVycyB3aGVuZXZlciBhIGNvbW1lbnQgaXMgc2tpcHBlZC4gYGJsb2NrYCBpcyBhXG4gICAgLy8gYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhpcyBpcyBhIGJsb2NrIChgLyogKi9gKSBjb21tZW50LFxuICAgIC8vIGB0ZXh0YCBpcyB0aGUgY29udGVudCBvZiB0aGUgY29tbWVudCwgYW5kIGBzdGFydGAgYW5kIGBlbmRgIGFyZVxuICAgIC8vIGNoYXJhY3RlciBvZmZzZXRzIHRoYXQgZGVub3RlIHRoZSBzdGFydCBhbmQgZW5kIG9mIHRoZSBjb21tZW50LlxuICAgIC8vIFdoZW4gdGhlIGBsb2NhdGlvbnNgIG9wdGlvbiBpcyBvbiwgdHdvIG1vcmUgcGFyYW1ldGVycyBhcmVcbiAgICAvLyBwYXNzZWQsIHRoZSBmdWxsIGB7bGluZSwgY29sdW1ufWAgbG9jYXRpb25zIG9mIHRoZSBzdGFydCBhbmRcbiAgICAvLyBlbmQgb2YgdGhlIGNvbW1lbnRzLiBOb3RlIHRoYXQgeW91IGFyZSBub3QgYWxsb3dlZCB0byBjYWxsIHRoZVxuICAgIC8vIHBhcnNlciBmcm9tIHRoZSBjYWxsYmFja+KAlHRoYXQgd2lsbCBjb3JydXB0IGl0cyBpbnRlcm5hbCBzdGF0ZS5cbiAgICBvbkNvbW1lbnQ6IG51bGwsXG4gICAgLy8gTm9kZXMgaGF2ZSB0aGVpciBzdGFydCBhbmQgZW5kIGNoYXJhY3RlcnMgb2Zmc2V0cyByZWNvcmRlZCBpblxuICAgIC8vIGBzdGFydGAgYW5kIGBlbmRgIHByb3BlcnRpZXMgKGRpcmVjdGx5IG9uIHRoZSBub2RlLCByYXRoZXIgdGhhblxuICAgIC8vIHRoZSBgbG9jYCBvYmplY3QsIHdoaWNoIGhvbGRzIGxpbmUvY29sdW1uIGRhdGEuIFRvIGFsc28gYWRkIGFcbiAgICAvLyBbc2VtaS1zdGFuZGFyZGl6ZWRdW3JhbmdlXSBgcmFuZ2VgIHByb3BlcnR5IGhvbGRpbmcgYSBgW3N0YXJ0LFxuICAgIC8vIGVuZF1gIGFycmF5IHdpdGggdGhlIHNhbWUgbnVtYmVycywgc2V0IHRoZSBgcmFuZ2VzYCBvcHRpb24gdG9cbiAgICAvLyBgdHJ1ZWAuXG4gICAgLy9cbiAgICAvLyBbcmFuZ2VdOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD03NDU2NzhcbiAgICByYW5nZXM6IGZhbHNlLFxuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRvIHBhcnNlIG11bHRpcGxlIGZpbGVzIGludG8gYSBzaW5nbGUgQVNUIGJ5XG4gICAgLy8gcGFzc2luZyB0aGUgdHJlZSBwcm9kdWNlZCBieSBwYXJzaW5nIHRoZSBmaXJzdCBmaWxlIGFzXG4gICAgLy8gYHByb2dyYW1gIG9wdGlvbiBpbiBzdWJzZXF1ZW50IHBhcnNlcy4gVGhpcyB3aWxsIGFkZCB0aGVcbiAgICAvLyB0b3BsZXZlbCBmb3JtcyBvZiB0aGUgcGFyc2VkIGZpbGUgdG8gdGhlIGBQcm9ncmFtYCAodG9wKSBub2RlXG4gICAgLy8gb2YgYW4gZXhpc3RpbmcgcGFyc2UgdHJlZS5cbiAgICBwcm9ncmFtOiBudWxsLFxuICAgIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIHlvdSBjYW4gcGFzcyB0aGlzIHRvIHJlY29yZCB0aGUgc291cmNlXG4gICAgLy8gZmlsZSBpbiBldmVyeSBub2RlJ3MgYGxvY2Agb2JqZWN0LlxuICAgIHNvdXJjZUZpbGU6IG51bGwsXG4gICAgLy8gVGhpcyB2YWx1ZSwgaWYgZ2l2ZW4sIGlzIHN0b3JlZCBpbiBldmVyeSBub2RlLCB3aGV0aGVyXG4gICAgLy8gYGxvY2F0aW9uc2AgaXMgb24gb3Igb2ZmLlxuICAgIGRpcmVjdFNvdXJjZUZpbGU6IG51bGxcbiAgfTtcblxuICBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdHMpIHtcbiAgICBvcHRpb25zID0gb3B0cyB8fCB7fTtcbiAgICBmb3IgKHZhciBvcHQgaW4gZGVmYXVsdE9wdGlvbnMpIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsIG9wdCkpXG4gICAgICBvcHRpb25zW29wdF0gPSBkZWZhdWx0T3B0aW9uc1tvcHRdO1xuICAgIHNvdXJjZUZpbGUgPSBvcHRpb25zLnNvdXJjZUZpbGUgfHwgbnVsbDtcblxuICAgIGlzS2V5d29yZCA9IG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiA/IGlzRWNtYTZLZXl3b3JkIDogaXNFY21hNUFuZExlc3NLZXl3b3JkO1xuICB9XG5cbiAgLy8gVGhlIGBnZXRMaW5lSW5mb2AgZnVuY3Rpb24gaXMgbW9zdGx5IHVzZWZ1bCB3aGVuIHRoZVxuICAvLyBgbG9jYXRpb25zYCBvcHRpb24gaXMgb2ZmIChmb3IgcGVyZm9ybWFuY2UgcmVhc29ucykgYW5kIHlvdVxuICAvLyB3YW50IHRvIGZpbmQgdGhlIGxpbmUvY29sdW1uIHBvc2l0aW9uIGZvciBhIGdpdmVuIGNoYXJhY3RlclxuICAvLyBvZmZzZXQuIGBpbnB1dGAgc2hvdWxkIGJlIHRoZSBjb2RlIHN0cmluZyB0aGF0IHRoZSBvZmZzZXQgcmVmZXJzXG4gIC8vIGludG8uXG5cbiAgdmFyIGdldExpbmVJbmZvID0gZXhwb3J0cy5nZXRMaW5lSW5mbyA9IGZ1bmN0aW9uKGlucHV0LCBvZmZzZXQpIHtcbiAgICBmb3IgKHZhciBsaW5lID0gMSwgY3VyID0gMDs7KSB7XG4gICAgICBsaW5lQnJlYWsubGFzdEluZGV4ID0gY3VyO1xuICAgICAgdmFyIG1hdGNoID0gbGluZUJyZWFrLmV4ZWMoaW5wdXQpO1xuICAgICAgaWYgKG1hdGNoICYmIG1hdGNoLmluZGV4IDwgb2Zmc2V0KSB7XG4gICAgICAgICsrbGluZTtcbiAgICAgICAgY3VyID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICB9IGVsc2UgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiB7bGluZTogbGluZSwgY29sdW1uOiBvZmZzZXQgLSBjdXJ9O1xuICB9O1xuXG4gIC8vIEFjb3JuIGlzIG9yZ2FuaXplZCBhcyBhIHRva2VuaXplciBhbmQgYSByZWN1cnNpdmUtZGVzY2VudCBwYXJzZXIuXG4gIC8vIFRoZSBgdG9rZW5pemVgIGV4cG9ydCBwcm92aWRlcyBhbiBpbnRlcmZhY2UgdG8gdGhlIHRva2VuaXplci5cbiAgLy8gQmVjYXVzZSB0aGUgdG9rZW5pemVyIGlzIG9wdGltaXplZCBmb3IgYmVpbmcgZWZmaWNpZW50bHkgdXNlZCBieVxuICAvLyB0aGUgQWNvcm4gcGFyc2VyIGl0c2VsZiwgdGhpcyBpbnRlcmZhY2UgaXMgc29tZXdoYXQgY3J1ZGUgYW5kIG5vdFxuICAvLyB2ZXJ5IG1vZHVsYXIuIFBlcmZvcm1pbmcgYW5vdGhlciBwYXJzZSBvciBjYWxsIHRvIGB0b2tlbml6ZWAgd2lsbFxuICAvLyByZXNldCB0aGUgaW50ZXJuYWwgc3RhdGUsIGFuZCBpbnZhbGlkYXRlIGV4aXN0aW5nIHRva2VuaXplcnMuXG5cbiAgZXhwb3J0cy50b2tlbml6ZSA9IGZ1bmN0aW9uKGlucHQsIG9wdHMpIHtcbiAgICBpbnB1dCA9IFN0cmluZyhpbnB0KTsgaW5wdXRMZW4gPSBpbnB1dC5sZW5ndGg7XG4gICAgc2V0T3B0aW9ucyhvcHRzKTtcbiAgICBpbml0VG9rZW5TdGF0ZSgpO1xuXG4gICAgdmFyIHQgPSB7fTtcbiAgICBmdW5jdGlvbiBnZXRUb2tlbihmb3JjZVJlZ2V4cCkge1xuICAgICAgbGFzdEVuZCA9IHRva0VuZDtcbiAgICAgIHJlYWRUb2tlbihmb3JjZVJlZ2V4cCk7XG4gICAgICB0LnN0YXJ0ID0gdG9rU3RhcnQ7IHQuZW5kID0gdG9rRW5kO1xuICAgICAgdC5zdGFydExvYyA9IHRva1N0YXJ0TG9jOyB0LmVuZExvYyA9IHRva0VuZExvYztcbiAgICAgIHQudHlwZSA9IHRva1R5cGU7IHQudmFsdWUgPSB0b2tWYWw7XG4gICAgICByZXR1cm4gdDtcbiAgICB9XG4gICAgZ2V0VG9rZW4uanVtcFRvID0gZnVuY3Rpb24ocG9zLCByZUFsbG93ZWQpIHtcbiAgICAgIHRva1BvcyA9IHBvcztcbiAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICB0b2tDdXJMaW5lID0gMTtcbiAgICAgICAgdG9rTGluZVN0YXJ0ID0gbGluZUJyZWFrLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIHZhciBtYXRjaDtcbiAgICAgICAgd2hpbGUgKChtYXRjaCA9IGxpbmVCcmVhay5leGVjKGlucHV0KSkgJiYgbWF0Y2guaW5kZXggPCBwb3MpIHtcbiAgICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgICAgdG9rTGluZVN0YXJ0ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRva1JlZ2V4cEFsbG93ZWQgPSByZUFsbG93ZWQ7XG4gICAgICBza2lwU3BhY2UoKTtcbiAgICB9O1xuICAgIHJldHVybiBnZXRUb2tlbjtcbiAgfTtcblxuICAvLyBTdGF0ZSBpcyBrZXB0IGluIChjbG9zdXJlLSlnbG9iYWwgdmFyaWFibGVzLiBXZSBhbHJlYWR5IHNhdyB0aGVcbiAgLy8gYG9wdGlvbnNgLCBgaW5wdXRgLCBhbmQgYGlucHV0TGVuYCB2YXJpYWJsZXMgYWJvdmUuXG5cbiAgLy8gVGhlIGN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHRva2VuaXplciBpbiB0aGUgaW5wdXQuXG5cbiAgdmFyIHRva1BvcztcblxuICAvLyBUaGUgc3RhcnQgYW5kIGVuZCBvZmZzZXRzIG9mIHRoZSBjdXJyZW50IHRva2VuLlxuXG4gIHZhciB0b2tTdGFydCwgdG9rRW5kO1xuXG4gIC8vIFdoZW4gYG9wdGlvbnMubG9jYXRpb25zYCBpcyB0cnVlLCB0aGVzZSBob2xkIG9iamVjdHNcbiAgLy8gY29udGFpbmluZyB0aGUgdG9rZW5zIHN0YXJ0IGFuZCBlbmQgbGluZS9jb2x1bW4gcGFpcnMuXG5cbiAgdmFyIHRva1N0YXJ0TG9jLCB0b2tFbmRMb2M7XG5cbiAgLy8gVGhlIHR5cGUgYW5kIHZhbHVlIG9mIHRoZSBjdXJyZW50IHRva2VuLiBUb2tlbiB0eXBlcyBhcmUgb2JqZWN0cyxcbiAgLy8gbmFtZWQgYnkgdmFyaWFibGVzIGFnYWluc3Qgd2hpY2ggdGhleSBjYW4gYmUgY29tcGFyZWQsIGFuZFxuICAvLyBob2xkaW5nIHByb3BlcnRpZXMgdGhhdCBkZXNjcmliZSB0aGVtIChpbmRpY2F0aW5nLCBmb3IgZXhhbXBsZSxcbiAgLy8gdGhlIHByZWNlZGVuY2Ugb2YgYW4gaW5maXggb3BlcmF0b3IsIGFuZCB0aGUgb3JpZ2luYWwgbmFtZSBvZiBhXG4gIC8vIGtleXdvcmQgdG9rZW4pLiBUaGUga2luZCBvZiB2YWx1ZSB0aGF0J3MgaGVsZCBpbiBgdG9rVmFsYCBkZXBlbmRzXG4gIC8vIG9uIHRoZSB0eXBlIG9mIHRoZSB0b2tlbi4gRm9yIGxpdGVyYWxzLCBpdCBpcyB0aGUgbGl0ZXJhbCB2YWx1ZSxcbiAgLy8gZm9yIG9wZXJhdG9ycywgdGhlIG9wZXJhdG9yIG5hbWUsIGFuZCBzbyBvbi5cblxuICB2YXIgdG9rVHlwZSwgdG9rVmFsO1xuXG4gIC8vIEludGVyYWwgc3RhdGUgZm9yIHRoZSB0b2tlbml6ZXIuIFRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGl2aXNpb25cbiAgLy8gb3BlcmF0b3JzIGFuZCByZWd1bGFyIGV4cHJlc3Npb25zLCBpdCByZW1lbWJlcnMgd2hldGhlciB0aGUgbGFzdFxuICAvLyB0b2tlbiB3YXMgb25lIHRoYXQgaXMgYWxsb3dlZCB0byBiZSBmb2xsb3dlZCBieSBhbiBleHByZXNzaW9uLlxuICAvLyAoSWYgaXQgaXMsIGEgc2xhc2ggaXMgcHJvYmFibHkgYSByZWdleHAsIGlmIGl0IGlzbid0IGl0J3MgYVxuICAvLyBkaXZpc2lvbiBvcGVyYXRvci4gU2VlIHRoZSBgcGFyc2VTdGF0ZW1lbnRgIGZ1bmN0aW9uIGZvciBhXG4gIC8vIGNhdmVhdC4pXG5cbiAgdmFyIHRva1JlZ2V4cEFsbG93ZWQ7XG5cbiAgLy8gV2hlbiBgb3B0aW9ucy5sb2NhdGlvbnNgIGlzIHRydWUsIHRoZXNlIGFyZSB1c2VkIHRvIGtlZXBcbiAgLy8gdHJhY2sgb2YgdGhlIGN1cnJlbnQgbGluZSwgYW5kIGtub3cgd2hlbiBhIG5ldyBsaW5lIGhhcyBiZWVuXG4gIC8vIGVudGVyZWQuXG5cbiAgdmFyIHRva0N1ckxpbmUsIHRva0xpbmVTdGFydDtcblxuICAvLyBUaGVzZSBzdG9yZSB0aGUgcG9zaXRpb24gb2YgdGhlIHByZXZpb3VzIHRva2VuLCB3aGljaCBpcyB1c2VmdWxcbiAgLy8gd2hlbiBmaW5pc2hpbmcgYSBub2RlIGFuZCBhc3NpZ25pbmcgaXRzIGBlbmRgIHBvc2l0aW9uLlxuXG4gIHZhciBsYXN0U3RhcnQsIGxhc3RFbmQsIGxhc3RFbmRMb2M7XG5cbiAgLy8gVGhpcyBpcyB0aGUgcGFyc2VyJ3Mgc3RhdGUuIGBpbkZ1bmN0aW9uYCBpcyB1c2VkIHRvIHJlamVjdFxuICAvLyBgcmV0dXJuYCBzdGF0ZW1lbnRzIG91dHNpZGUgb2YgZnVuY3Rpb25zLCBgbGFiZWxzYCB0byB2ZXJpZnkgdGhhdFxuICAvLyBgYnJlYWtgIGFuZCBgY29udGludWVgIGhhdmUgc29tZXdoZXJlIHRvIGp1bXAgdG8sIGFuZCBgc3RyaWN0YFxuICAvLyBpbmRpY2F0ZXMgd2hldGhlciBzdHJpY3QgbW9kZSBpcyBvbi5cblxuICB2YXIgaW5GdW5jdGlvbiwgbGFiZWxzLCBzdHJpY3Q7XG5cbiAgLy8gVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIHJhaXNlIGV4Y2VwdGlvbnMgb24gcGFyc2UgZXJyb3JzLiBJdFxuICAvLyB0YWtlcyBhbiBvZmZzZXQgaW50ZWdlciAoaW50byB0aGUgY3VycmVudCBgaW5wdXRgKSB0byBpbmRpY2F0ZVxuICAvLyB0aGUgbG9jYXRpb24gb2YgdGhlIGVycm9yLCBhdHRhY2hlcyB0aGUgcG9zaXRpb24gdG8gdGhlIGVuZFxuICAvLyBvZiB0aGUgZXJyb3IgbWVzc2FnZSwgYW5kIHRoZW4gcmFpc2VzIGEgYFN5bnRheEVycm9yYCB3aXRoIHRoYXRcbiAgLy8gbWVzc2FnZS5cblxuICBmdW5jdGlvbiByYWlzZShwb3MsIG1lc3NhZ2UpIHtcbiAgICB2YXIgbG9jID0gZ2V0TGluZUluZm8oaW5wdXQsIHBvcyk7XG4gICAgbWVzc2FnZSArPSBcIiAoXCIgKyBsb2MubGluZSArIFwiOlwiICsgbG9jLmNvbHVtbiArIFwiKVwiO1xuICAgIHZhciBlcnIgPSBuZXcgU3ludGF4RXJyb3IobWVzc2FnZSk7XG4gICAgZXJyLnBvcyA9IHBvczsgZXJyLmxvYyA9IGxvYzsgZXJyLnJhaXNlZEF0ID0gdG9rUG9zO1xuICAgIHRocm93IGVycjtcbiAgfVxuXG4gIC8vIFJldXNlZCBlbXB0eSBhcnJheSBhZGRlZCBmb3Igbm9kZSBmaWVsZHMgdGhhdCBhcmUgYWx3YXlzIGVtcHR5LlxuXG4gIHZhciBlbXB0eSA9IFtdO1xuXG4gIC8vICMjIFRva2VuIHR5cGVzXG5cbiAgLy8gVGhlIGFzc2lnbm1lbnQgb2YgZmluZS1ncmFpbmVkLCBpbmZvcm1hdGlvbi1jYXJyeWluZyB0eXBlIG9iamVjdHNcbiAgLy8gYWxsb3dzIHRoZSB0b2tlbml6ZXIgdG8gc3RvcmUgdGhlIGluZm9ybWF0aW9uIGl0IGhhcyBhYm91dCBhXG4gIC8vIHRva2VuIGluIGEgd2F5IHRoYXQgaXMgdmVyeSBjaGVhcCBmb3IgdGhlIHBhcnNlciB0byBsb29rIHVwLlxuXG4gIC8vIEFsbCB0b2tlbiB0eXBlIHZhcmlhYmxlcyBzdGFydCB3aXRoIGFuIHVuZGVyc2NvcmUsIHRvIG1ha2UgdGhlbVxuICAvLyBlYXN5IHRvIHJlY29nbml6ZS5cblxuICAvLyBUaGVzZSBhcmUgdGhlIGdlbmVyYWwgdHlwZXMuIFRoZSBgdHlwZWAgcHJvcGVydHkgaXMgb25seSB1c2VkIHRvXG4gIC8vIG1ha2UgdGhlbSByZWNvZ25pemVhYmxlIHdoZW4gZGVidWdnaW5nLlxuXG4gIHZhciBfbnVtID0ge3R5cGU6IFwibnVtXCJ9LCBfcmVnZXhwID0ge3R5cGU6IFwicmVnZXhwXCJ9LCBfc3RyaW5nID0ge3R5cGU6IFwic3RyaW5nXCJ9O1xuICB2YXIgX25hbWUgPSB7dHlwZTogXCJuYW1lXCJ9LCBfZW9mID0ge3R5cGU6IFwiZW9mXCJ9O1xuXG4gIC8vIEtleXdvcmQgdG9rZW5zLiBUaGUgYGtleXdvcmRgIHByb3BlcnR5IChhbHNvIHVzZWQgaW4ga2V5d29yZC1saWtlXG4gIC8vIG9wZXJhdG9ycykgaW5kaWNhdGVzIHRoYXQgdGhlIHRva2VuIG9yaWdpbmF0ZWQgZnJvbSBhblxuICAvLyBpZGVudGlmaWVyLWxpa2Ugd29yZCwgd2hpY2ggaXMgdXNlZCB3aGVuIHBhcnNpbmcgcHJvcGVydHkgbmFtZXMuXG4gIC8vXG4gIC8vIFRoZSBgYmVmb3JlRXhwcmAgcHJvcGVydHkgaXMgdXNlZCB0byBkaXNhbWJpZ3VhdGUgYmV0d2VlbiByZWd1bGFyXG4gIC8vIGV4cHJlc3Npb25zIGFuZCBkaXZpc2lvbnMuIEl0IGlzIHNldCBvbiBhbGwgdG9rZW4gdHlwZXMgdGhhdCBjYW5cbiAgLy8gYmUgZm9sbG93ZWQgYnkgYW4gZXhwcmVzc2lvbiAodGh1cywgYSBzbGFzaCBhZnRlciB0aGVtIHdvdWxkIGJlIGFcbiAgLy8gcmVndWxhciBleHByZXNzaW9uKS5cbiAgLy9cbiAgLy8gYGlzTG9vcGAgbWFya3MgYSBrZXl3b3JkIGFzIHN0YXJ0aW5nIGEgbG9vcCwgd2hpY2ggaXMgaW1wb3J0YW50XG4gIC8vIHRvIGtub3cgd2hlbiBwYXJzaW5nIGEgbGFiZWwsIGluIG9yZGVyIHRvIGFsbG93IG9yIGRpc2FsbG93XG4gIC8vIGNvbnRpbnVlIGp1bXBzIHRvIHRoYXQgbGFiZWwuXG5cbiAgdmFyIF9icmVhayA9IHtrZXl3b3JkOiBcImJyZWFrXCJ9LCBfY2FzZSA9IHtrZXl3b3JkOiBcImNhc2VcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9jYXRjaCA9IHtrZXl3b3JkOiBcImNhdGNoXCJ9O1xuICB2YXIgX2NvbnRpbnVlID0ge2tleXdvcmQ6IFwiY29udGludWVcIn0sIF9kZWJ1Z2dlciA9IHtrZXl3b3JkOiBcImRlYnVnZ2VyXCJ9LCBfZGVmYXVsdCA9IHtrZXl3b3JkOiBcImRlZmF1bHRcIn07XG4gIHZhciBfZG8gPSB7a2V5d29yZDogXCJkb1wiLCBpc0xvb3A6IHRydWV9LCBfZWxzZSA9IHtrZXl3b3JkOiBcImVsc2VcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfZmluYWxseSA9IHtrZXl3b3JkOiBcImZpbmFsbHlcIn0sIF9mb3IgPSB7a2V5d29yZDogXCJmb3JcIiwgaXNMb29wOiB0cnVlfSwgX2Z1bmN0aW9uID0ge2tleXdvcmQ6IFwiZnVuY3Rpb25cIn07XG4gIHZhciBfaWYgPSB7a2V5d29yZDogXCJpZlwifSwgX3JldHVybiA9IHtrZXl3b3JkOiBcInJldHVyblwiLCBiZWZvcmVFeHByOiB0cnVlfSwgX3N3aXRjaCA9IHtrZXl3b3JkOiBcInN3aXRjaFwifTtcbiAgdmFyIF90aHJvdyA9IHtrZXl3b3JkOiBcInRocm93XCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfdHJ5ID0ge2tleXdvcmQ6IFwidHJ5XCJ9LCBfdmFyID0ge2tleXdvcmQ6IFwidmFyXCJ9O1xuICB2YXIgX2xldCA9IHtrZXl3b3JkOiBcImxldFwifSwgX2NvbnN0ID0ge2tleXdvcmQ6IFwiY29uc3RcIn07XG4gIHZhciBfd2hpbGUgPSB7a2V5d29yZDogXCJ3aGlsZVwiLCBpc0xvb3A6IHRydWV9LCBfd2l0aCA9IHtrZXl3b3JkOiBcIndpdGhcIn0sIF9uZXcgPSB7a2V5d29yZDogXCJuZXdcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfdGhpcyA9IHtrZXl3b3JkOiBcInRoaXNcIn07XG5cbiAgLy8gVGhlIGtleXdvcmRzIHRoYXQgZGVub3RlIHZhbHVlcy5cblxuICB2YXIgX251bGwgPSB7a2V5d29yZDogXCJudWxsXCIsIGF0b21WYWx1ZTogbnVsbH0sIF90cnVlID0ge2tleXdvcmQ6IFwidHJ1ZVwiLCBhdG9tVmFsdWU6IHRydWV9O1xuICB2YXIgX2ZhbHNlID0ge2tleXdvcmQ6IFwiZmFsc2VcIiwgYXRvbVZhbHVlOiBmYWxzZX07XG5cbiAgLy8gU29tZSBrZXl3b3JkcyBhcmUgdHJlYXRlZCBhcyByZWd1bGFyIG9wZXJhdG9ycy4gYGluYCBzb21ldGltZXNcbiAgLy8gKHdoZW4gcGFyc2luZyBgZm9yYCkgbmVlZHMgdG8gYmUgdGVzdGVkIGFnYWluc3Qgc3BlY2lmaWNhbGx5LCBzb1xuICAvLyB3ZSBhc3NpZ24gYSB2YXJpYWJsZSBuYW1lIHRvIGl0IGZvciBxdWljayBjb21wYXJpbmcuXG5cbiAgdmFyIF9pbiA9IHtrZXl3b3JkOiBcImluXCIsIGJpbm9wOiA3LCBiZWZvcmVFeHByOiB0cnVlfTtcblxuICAvLyBNYXAga2V5d29yZCBuYW1lcyB0byB0b2tlbiB0eXBlcy5cblxuICB2YXIga2V5d29yZFR5cGVzID0ge1wiYnJlYWtcIjogX2JyZWFrLCBcImNhc2VcIjogX2Nhc2UsIFwiY2F0Y2hcIjogX2NhdGNoLFxuICAgICAgICAgICAgICAgICAgICAgIFwiY29udGludWVcIjogX2NvbnRpbnVlLCBcImRlYnVnZ2VyXCI6IF9kZWJ1Z2dlciwgXCJkZWZhdWx0XCI6IF9kZWZhdWx0LFxuICAgICAgICAgICAgICAgICAgICAgIFwiZG9cIjogX2RvLCBcImVsc2VcIjogX2Vsc2UsIFwiZmluYWxseVwiOiBfZmluYWxseSwgXCJmb3JcIjogX2ZvcixcbiAgICAgICAgICAgICAgICAgICAgICBcImZ1bmN0aW9uXCI6IF9mdW5jdGlvbiwgXCJpZlwiOiBfaWYsIFwicmV0dXJuXCI6IF9yZXR1cm4sIFwic3dpdGNoXCI6IF9zd2l0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ0aHJvd1wiOiBfdGhyb3csIFwidHJ5XCI6IF90cnksIFwidmFyXCI6IF92YXIsIFwibGV0XCI6IF9sZXQsIFwiY29uc3RcIjogX2NvbnN0LFxuICAgICAgICAgICAgICAgICAgICAgIFwid2hpbGVcIjogX3doaWxlLCBcIndpdGhcIjogX3dpdGgsXG4gICAgICAgICAgICAgICAgICAgICAgXCJudWxsXCI6IF9udWxsLCBcInRydWVcIjogX3RydWUsIFwiZmFsc2VcIjogX2ZhbHNlLCBcIm5ld1wiOiBfbmV3LCBcImluXCI6IF9pbixcbiAgICAgICAgICAgICAgICAgICAgICBcImluc3RhbmNlb2ZcIjoge2tleXdvcmQ6IFwiaW5zdGFuY2VvZlwiLCBiaW5vcDogNywgYmVmb3JlRXhwcjogdHJ1ZX0sIFwidGhpc1wiOiBfdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICBcInR5cGVvZlwiOiB7a2V5d29yZDogXCJ0eXBlb2ZcIiwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfSxcbiAgICAgICAgICAgICAgICAgICAgICBcInZvaWRcIjoge2tleXdvcmQ6IFwidm9pZFwiLCBwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9LFxuICAgICAgICAgICAgICAgICAgICAgIFwiZGVsZXRlXCI6IHtrZXl3b3JkOiBcImRlbGV0ZVwiLCBwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9fTtcblxuICAvLyBQdW5jdHVhdGlvbiB0b2tlbiB0eXBlcy4gQWdhaW4sIHRoZSBgdHlwZWAgcHJvcGVydHkgaXMgcHVyZWx5IGZvciBkZWJ1Z2dpbmcuXG5cbiAgdmFyIF9icmFja2V0TCA9IHt0eXBlOiBcIltcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9icmFja2V0UiA9IHt0eXBlOiBcIl1cIn0sIF9icmFjZUwgPSB7dHlwZTogXCJ7XCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JyYWNlUiA9IHt0eXBlOiBcIn1cIn0sIF9wYXJlbkwgPSB7dHlwZTogXCIoXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfcGFyZW5SID0ge3R5cGU6IFwiKVwifTtcbiAgdmFyIF9jb21tYSA9IHt0eXBlOiBcIixcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9zZW1pID0ge3R5cGU6IFwiO1wiLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9jb2xvbiA9IHt0eXBlOiBcIjpcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9kb3QgPSB7dHlwZTogXCIuXCJ9LCBfZWxsaXBzaXMgPSB7dHlwZTogXCIuLi5cIn0sIF9xdWVzdGlvbiA9IHt0eXBlOiBcIj9cIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG5cbiAgLy8gT3BlcmF0b3JzLiBUaGVzZSBjYXJyeSBzZXZlcmFsIGtpbmRzIG9mIHByb3BlcnRpZXMgdG8gaGVscCB0aGVcbiAgLy8gcGFyc2VyIHVzZSB0aGVtIHByb3Blcmx5ICh0aGUgcHJlc2VuY2Ugb2YgdGhlc2UgcHJvcGVydGllcyBpc1xuICAvLyB3aGF0IGNhdGVnb3JpemVzIHRoZW0gYXMgb3BlcmF0b3JzKS5cbiAgLy9cbiAgLy8gYGJpbm9wYCwgd2hlbiBwcmVzZW50LCBzcGVjaWZpZXMgdGhhdCB0aGlzIG9wZXJhdG9yIGlzIGEgYmluYXJ5XG4gIC8vIG9wZXJhdG9yLCBhbmQgd2lsbCByZWZlciB0byBpdHMgcHJlY2VkZW5jZS5cbiAgLy9cbiAgLy8gYHByZWZpeGAgYW5kIGBwb3N0Zml4YCBtYXJrIHRoZSBvcGVyYXRvciBhcyBhIHByZWZpeCBvciBwb3N0Zml4XG4gIC8vIHVuYXJ5IG9wZXJhdG9yLiBgaXNVcGRhdGVgIHNwZWNpZmllcyB0aGF0IHRoZSBub2RlIHByb2R1Y2VkIGJ5XG4gIC8vIHRoZSBvcGVyYXRvciBzaG91bGQgYmUgb2YgdHlwZSBVcGRhdGVFeHByZXNzaW9uIHJhdGhlciB0aGFuXG4gIC8vIHNpbXBseSBVbmFyeUV4cHJlc3Npb24gKGArK2AgYW5kIGAtLWApLlxuICAvL1xuICAvLyBgaXNBc3NpZ25gIG1hcmtzIGFsbCBvZiBgPWAsIGArPWAsIGAtPWAgZXRjZXRlcmEsIHdoaWNoIGFjdCBhc1xuICAvLyBiaW5hcnkgb3BlcmF0b3JzIHdpdGggYSB2ZXJ5IGxvdyBwcmVjZWRlbmNlLCB0aGF0IHNob3VsZCByZXN1bHRcbiAgLy8gaW4gQXNzaWdubWVudEV4cHJlc3Npb24gbm9kZXMuXG5cbiAgdmFyIF9zbGFzaCA9IHtiaW5vcDogMTAsIGJlZm9yZUV4cHI6IHRydWV9LCBfZXEgPSB7aXNBc3NpZ246IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2Fzc2lnbiA9IHtpc0Fzc2lnbjogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfaW5jRGVjID0ge3Bvc3RmaXg6IHRydWUsIHByZWZpeDogdHJ1ZSwgaXNVcGRhdGU6IHRydWV9LCBfcHJlZml4ID0ge3ByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfbG9naWNhbE9SID0ge2Jpbm9wOiAxLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9sb2dpY2FsQU5EID0ge2Jpbm9wOiAyLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXR3aXNlT1IgPSB7Ymlub3A6IDMsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JpdHdpc2VYT1IgPSB7Ymlub3A6IDQsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JpdHdpc2VBTkQgPSB7Ymlub3A6IDUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2VxdWFsaXR5ID0ge2Jpbm9wOiA2LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9yZWxhdGlvbmFsID0ge2Jpbm9wOiA3LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXRTaGlmdCA9IHtiaW5vcDogOCwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfcGx1c01pbiA9IHtiaW5vcDogOSwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9tdWx0aXBseU1vZHVsbyA9IHtiaW5vcDogMTAsIGJlZm9yZUV4cHI6IHRydWV9O1xuXG4gIC8vIFByb3ZpZGUgYWNjZXNzIHRvIHRoZSB0b2tlbiB0eXBlcyBmb3IgZXh0ZXJuYWwgdXNlcnMgb2YgdGhlXG4gIC8vIHRva2VuaXplci5cblxuICBleHBvcnRzLnRva1R5cGVzID0ge2JyYWNrZXRMOiBfYnJhY2tldEwsIGJyYWNrZXRSOiBfYnJhY2tldFIsIGJyYWNlTDogX2JyYWNlTCwgYnJhY2VSOiBfYnJhY2VSLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVuTDogX3BhcmVuTCwgcGFyZW5SOiBfcGFyZW5SLCBjb21tYTogX2NvbW1hLCBzZW1pOiBfc2VtaSwgY29sb246IF9jb2xvbixcbiAgICAgICAgICAgICAgICAgICAgICBkb3Q6IF9kb3QsIGVsbGlwc2lzOiBfZWxsaXBzaXMsIHF1ZXN0aW9uOiBfcXVlc3Rpb24sIHNsYXNoOiBfc2xhc2gsIGVxOiBfZXEsXG4gICAgICAgICAgICAgICAgICAgICAgbmFtZTogX25hbWUsIGVvZjogX2VvZiwgbnVtOiBfbnVtLCByZWdleHA6IF9yZWdleHAsIHN0cmluZzogX3N0cmluZ307XG4gIGZvciAodmFyIGt3IGluIGtleXdvcmRUeXBlcykgZXhwb3J0cy50b2tUeXBlc1tcIl9cIiArIGt3XSA9IGtleXdvcmRUeXBlc1trd107XG5cbiAgLy8gVGhpcyBpcyBhIHRyaWNrIHRha2VuIGZyb20gRXNwcmltYS4gSXQgdHVybnMgb3V0IHRoYXQsIG9uXG4gIC8vIG5vbi1DaHJvbWUgYnJvd3NlcnMsIHRvIGNoZWNrIHdoZXRoZXIgYSBzdHJpbmcgaXMgaW4gYSBzZXQsIGFcbiAgLy8gcHJlZGljYXRlIGNvbnRhaW5pbmcgYSBiaWcgdWdseSBgc3dpdGNoYCBzdGF0ZW1lbnQgaXMgZmFzdGVyIHRoYW5cbiAgLy8gYSByZWd1bGFyIGV4cHJlc3Npb24sIGFuZCBvbiBDaHJvbWUgdGhlIHR3byBhcmUgYWJvdXQgb24gcGFyLlxuICAvLyBUaGlzIGZ1bmN0aW9uIHVzZXMgYGV2YWxgIChub24tbGV4aWNhbCkgdG8gcHJvZHVjZSBzdWNoIGFcbiAgLy8gcHJlZGljYXRlIGZyb20gYSBzcGFjZS1zZXBhcmF0ZWQgc3RyaW5nIG9mIHdvcmRzLlxuICAvL1xuICAvLyBJdCBzdGFydHMgYnkgc29ydGluZyB0aGUgd29yZHMgYnkgbGVuZ3RoLlxuXG4gIGZ1bmN0aW9uIG1ha2VQcmVkaWNhdGUod29yZHMpIHtcbiAgICB3b3JkcyA9IHdvcmRzLnNwbGl0KFwiIFwiKTtcbiAgICB2YXIgZiA9IFwiXCIsIGNhdHMgPSBbXTtcbiAgICBvdXQ6IGZvciAodmFyIGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2F0cy5sZW5ndGg7ICsrailcbiAgICAgICAgaWYgKGNhdHNbal1bMF0ubGVuZ3RoID09IHdvcmRzW2ldLmxlbmd0aCkge1xuICAgICAgICAgIGNhdHNbal0ucHVzaCh3b3Jkc1tpXSk7XG4gICAgICAgICAgY29udGludWUgb3V0O1xuICAgICAgICB9XG4gICAgICBjYXRzLnB1c2goW3dvcmRzW2ldXSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbXBhcmVUbyhhcnIpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoID09IDEpIHJldHVybiBmICs9IFwicmV0dXJuIHN0ciA9PT0gXCIgKyBKU09OLnN0cmluZ2lmeShhcnJbMF0pICsgXCI7XCI7XG4gICAgICBmICs9IFwic3dpdGNoKHN0cil7XCI7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkgZiArPSBcImNhc2UgXCIgKyBKU09OLnN0cmluZ2lmeShhcnJbaV0pICsgXCI6XCI7XG4gICAgICBmICs9IFwicmV0dXJuIHRydWV9cmV0dXJuIGZhbHNlO1wiO1xuICAgIH1cblxuICAgIC8vIFdoZW4gdGhlcmUgYXJlIG1vcmUgdGhhbiB0aHJlZSBsZW5ndGggY2F0ZWdvcmllcywgYW4gb3V0ZXJcbiAgICAvLyBzd2l0Y2ggZmlyc3QgZGlzcGF0Y2hlcyBvbiB0aGUgbGVuZ3RocywgdG8gc2F2ZSBvbiBjb21wYXJpc29ucy5cblxuICAgIGlmIChjYXRzLmxlbmd0aCA+IDMpIHtcbiAgICAgIGNhdHMuc29ydChmdW5jdGlvbihhLCBiKSB7cmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7fSk7XG4gICAgICBmICs9IFwic3dpdGNoKHN0ci5sZW5ndGgpe1wiO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjYXQgPSBjYXRzW2ldO1xuICAgICAgICBmICs9IFwiY2FzZSBcIiArIGNhdFswXS5sZW5ndGggKyBcIjpcIjtcbiAgICAgICAgY29tcGFyZVRvKGNhdCk7XG4gICAgICB9XG4gICAgICBmICs9IFwifVwiO1xuXG4gICAgLy8gT3RoZXJ3aXNlLCBzaW1wbHkgZ2VuZXJhdGUgYSBmbGF0IGBzd2l0Y2hgIHN0YXRlbWVudC5cblxuICAgIH0gZWxzZSB7XG4gICAgICBjb21wYXJlVG8od29yZHMpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwic3RyXCIsIGYpO1xuICB9XG5cbiAgLy8gVGhlIEVDTUFTY3JpcHQgMyByZXNlcnZlZCB3b3JkIGxpc3QuXG5cbiAgdmFyIGlzUmVzZXJ2ZWRXb3JkMyA9IG1ha2VQcmVkaWNhdGUoXCJhYnN0cmFjdCBib29sZWFuIGJ5dGUgY2hhciBjbGFzcyBkb3VibGUgZW51bSBleHBvcnQgZXh0ZW5kcyBmaW5hbCBmbG9hdCBnb3RvIGltcGxlbWVudHMgaW1wb3J0IGludCBpbnRlcmZhY2UgbG9uZyBuYXRpdmUgcGFja2FnZSBwcml2YXRlIHByb3RlY3RlZCBwdWJsaWMgc2hvcnQgc3RhdGljIHN1cGVyIHN5bmNocm9uaXplZCB0aHJvd3MgdHJhbnNpZW50IHZvbGF0aWxlXCIpO1xuXG4gIC8vIEVDTUFTY3JpcHQgNSByZXNlcnZlZCB3b3Jkcy5cblxuICB2YXIgaXNSZXNlcnZlZFdvcmQ1ID0gbWFrZVByZWRpY2F0ZShcImNsYXNzIGVudW0gZXh0ZW5kcyBzdXBlciBjb25zdCBleHBvcnQgaW1wb3J0XCIpO1xuXG4gIC8vIFRoZSBhZGRpdGlvbmFsIHJlc2VydmVkIHdvcmRzIGluIHN0cmljdCBtb2RlLlxuXG4gIHZhciBpc1N0cmljdFJlc2VydmVkV29yZCA9IG1ha2VQcmVkaWNhdGUoXCJpbXBsZW1lbnRzIGludGVyZmFjZSBsZXQgcGFja2FnZSBwcml2YXRlIHByb3RlY3RlZCBwdWJsaWMgc3RhdGljIHlpZWxkXCIpO1xuXG4gIC8vIFRoZSBmb3JiaWRkZW4gdmFyaWFibGUgbmFtZXMgaW4gc3RyaWN0IG1vZGUuXG5cbiAgdmFyIGlzU3RyaWN0QmFkSWRXb3JkID0gbWFrZVByZWRpY2F0ZShcImV2YWwgYXJndW1lbnRzXCIpO1xuXG4gIC8vIEFuZCB0aGUga2V5d29yZHMuXG5cbiAgdmFyIGVjbWE1QW5kTGVzc0tleXdvcmRzID0gXCJicmVhayBjYXNlIGNhdGNoIGNvbnRpbnVlIGRlYnVnZ2VyIGRlZmF1bHQgZG8gZWxzZSBmaW5hbGx5IGZvciBmdW5jdGlvbiBpZiByZXR1cm4gc3dpdGNoIHRocm93IHRyeSB2YXIgd2hpbGUgd2l0aCBudWxsIHRydWUgZmFsc2UgaW5zdGFuY2VvZiB0eXBlb2Ygdm9pZCBkZWxldGUgbmV3IGluIHRoaXNcIjtcblxuICB2YXIgaXNFY21hNUFuZExlc3NLZXl3b3JkID0gbWFrZVByZWRpY2F0ZShlY21hNUFuZExlc3NLZXl3b3Jkcyk7XG5cbiAgdmFyIGlzRWNtYTZLZXl3b3JkID0gbWFrZVByZWRpY2F0ZShlY21hNUFuZExlc3NLZXl3b3JkcyArIFwiIGxldCBjb25zdFwiKTtcblxuICB2YXIgaXNLZXl3b3JkID0gaXNFY21hNUFuZExlc3NLZXl3b3JkO1xuXG4gIC8vICMjIENoYXJhY3RlciBjYXRlZ29yaWVzXG5cbiAgLy8gQmlnIHVnbHkgcmVndWxhciBleHByZXNzaW9ucyB0aGF0IG1hdGNoIGNoYXJhY3RlcnMgaW4gdGhlXG4gIC8vIHdoaXRlc3BhY2UsIGlkZW50aWZpZXIsIGFuZCBpZGVudGlmaWVyLXN0YXJ0IGNhdGVnb3JpZXMuIFRoZXNlXG4gIC8vIGFyZSBvbmx5IGFwcGxpZWQgd2hlbiBhIGNoYXJhY3RlciBpcyBmb3VuZCB0byBhY3R1YWxseSBoYXZlIGFcbiAgLy8gY29kZSBwb2ludCBhYm92ZSAxMjguXG5cbiAgdmFyIG5vbkFTQ0lJd2hpdGVzcGFjZSA9IC9bXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXS87XG4gIHZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzID0gXCJcXHhhYVxceGI1XFx4YmFcXHhjMC1cXHhkNlxceGQ4LVxceGY2XFx4ZjgtXFx1MDJjMVxcdTAyYzYtXFx1MDJkMVxcdTAyZTAtXFx1MDJlNFxcdTAyZWNcXHUwMmVlXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdhLVxcdTAzN2RcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0OGEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNWQwLVxcdTA1ZWFcXHUwNWYwLVxcdTA1ZjJcXHUwNjIwLVxcdTA2NGFcXHUwNjZlXFx1MDY2ZlxcdTA2NzEtXFx1MDZkM1xcdTA2ZDVcXHUwNmU1XFx1MDZlNlxcdTA2ZWVcXHUwNmVmXFx1MDZmYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTBcXHUwNzEyLVxcdTA3MmZcXHUwNzRkLVxcdTA3YTVcXHUwN2IxXFx1MDdjYS1cXHUwN2VhXFx1MDdmNFxcdTA3ZjVcXHUwN2ZhXFx1MDgwMC1cXHUwODE1XFx1MDgxYVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhhMFxcdTA4YTItXFx1MDhhY1xcdTA5MDQtXFx1MDkzOVxcdTA5M2RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk3MS1cXHUwOTc3XFx1MDk3OS1cXHUwOTdmXFx1MDk4NS1cXHUwOThjXFx1MDk4ZlxcdTA5OTBcXHUwOTkzLVxcdTA5YThcXHUwOWFhLVxcdTA5YjBcXHUwOWIyXFx1MDliNi1cXHUwOWI5XFx1MDliZFxcdTA5Y2VcXHUwOWRjXFx1MDlkZFxcdTA5ZGYtXFx1MDllMVxcdTA5ZjBcXHUwOWYxXFx1MGEwNS1cXHUwYTBhXFx1MGEwZlxcdTBhMTBcXHUwYTEzLVxcdTBhMjhcXHUwYTJhLVxcdTBhMzBcXHUwYTMyXFx1MGEzM1xcdTBhMzVcXHUwYTM2XFx1MGEzOFxcdTBhMzlcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE3Mi1cXHUwYTc0XFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJkXFx1MGFkMFxcdTBhZTBcXHUwYWUxXFx1MGIwNS1cXHUwYjBjXFx1MGIwZlxcdTBiMTBcXHUwYjEzLVxcdTBiMjhcXHUwYjJhLVxcdTBiMzBcXHUwYjMyXFx1MGIzM1xcdTBiMzUtXFx1MGIzOVxcdTBiM2RcXHUwYjVjXFx1MGI1ZFxcdTBiNWYtXFx1MGI2MVxcdTBiNzFcXHUwYjgzXFx1MGI4NS1cXHUwYjhhXFx1MGI4ZS1cXHUwYjkwXFx1MGI5Mi1cXHUwYjk1XFx1MGI5OVxcdTBiOWFcXHUwYjljXFx1MGI5ZVxcdTBiOWZcXHUwYmEzXFx1MGJhNFxcdTBiYTgtXFx1MGJhYVxcdTBiYWUtXFx1MGJiOVxcdTBiZDBcXHUwYzA1LVxcdTBjMGNcXHUwYzBlLVxcdTBjMTBcXHUwYzEyLVxcdTBjMjhcXHUwYzJhLVxcdTBjMzNcXHUwYzM1LVxcdTBjMzlcXHUwYzNkXFx1MGM1OFxcdTBjNTlcXHUwYzYwXFx1MGM2MVxcdTBjODUtXFx1MGM4Y1xcdTBjOGUtXFx1MGM5MFxcdTBjOTItXFx1MGNhOFxcdTBjYWEtXFx1MGNiM1xcdTBjYjUtXFx1MGNiOVxcdTBjYmRcXHUwY2RlXFx1MGNlMFxcdTBjZTFcXHUwY2YxXFx1MGNmMlxcdTBkMDUtXFx1MGQwY1xcdTBkMGUtXFx1MGQxMFxcdTBkMTItXFx1MGQzYVxcdTBkM2RcXHUwZDRlXFx1MGQ2MFxcdTBkNjFcXHUwZDdhLVxcdTBkN2ZcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGUwMS1cXHUwZTMwXFx1MGUzMlxcdTBlMzNcXHUwZTQwLVxcdTBlNDZcXHUwZTgxXFx1MGU4MlxcdTBlODRcXHUwZTg3XFx1MGU4OFxcdTBlOGFcXHUwZThkXFx1MGU5NC1cXHUwZTk3XFx1MGU5OS1cXHUwZTlmXFx1MGVhMS1cXHUwZWEzXFx1MGVhNVxcdTBlYTdcXHUwZWFhXFx1MGVhYlxcdTBlYWQtXFx1MGViMFxcdTBlYjJcXHUwZWIzXFx1MGViZFxcdTBlYzAtXFx1MGVjNFxcdTBlYzZcXHUwZWRjLVxcdTBlZGZcXHUwZjAwXFx1MGY0MC1cXHUwZjQ3XFx1MGY0OS1cXHUwZjZjXFx1MGY4OC1cXHUwZjhjXFx1MTAwMC1cXHUxMDJhXFx1MTAzZlxcdTEwNTAtXFx1MTA1NVxcdTEwNWEtXFx1MTA1ZFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNmUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOGVcXHUxMGEwLVxcdTEwYzVcXHUxMGM3XFx1MTBjZFxcdTEwZDAtXFx1MTBmYVxcdTEwZmMtXFx1MTI0OFxcdTEyNGEtXFx1MTI0ZFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVhLVxcdTEyNWRcXHUxMjYwLVxcdTEyODhcXHUxMjhhLVxcdTEyOGRcXHUxMjkwLVxcdTEyYjBcXHUxMmIyLVxcdTEyYjVcXHUxMmI4LVxcdTEyYmVcXHUxMmMwXFx1MTJjMi1cXHUxMmM1XFx1MTJjOC1cXHUxMmQ2XFx1MTJkOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVhXFx1MTM4MC1cXHUxMzhmXFx1MTNhMC1cXHUxM2Y0XFx1MTQwMS1cXHUxNjZjXFx1MTY2Zi1cXHUxNjdmXFx1MTY4MS1cXHUxNjlhXFx1MTZhMC1cXHUxNmVhXFx1MTZlZS1cXHUxNmYwXFx1MTcwMC1cXHUxNzBjXFx1MTcwZS1cXHUxNzExXFx1MTcyMC1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZjXFx1MTc2ZS1cXHUxNzcwXFx1MTc4MC1cXHUxN2IzXFx1MTdkN1xcdTE3ZGNcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4YThcXHUxOGFhXFx1MThiMC1cXHUxOGY1XFx1MTkwMC1cXHUxOTFjXFx1MTk1MC1cXHUxOTZkXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOWFiXFx1MTljMS1cXHUxOWM3XFx1MWEwMC1cXHUxYTE2XFx1MWEyMC1cXHUxYTU0XFx1MWFhN1xcdTFiMDUtXFx1MWIzM1xcdTFiNDUtXFx1MWI0YlxcdTFiODMtXFx1MWJhMFxcdTFiYWVcXHUxYmFmXFx1MWJiYS1cXHUxYmU1XFx1MWMwMC1cXHUxYzIzXFx1MWM0ZC1cXHUxYzRmXFx1MWM1YS1cXHUxYzdkXFx1MWNlOS1cXHUxY2VjXFx1MWNlZS1cXHUxY2YxXFx1MWNmNVxcdTFjZjZcXHUxZDAwLVxcdTFkYmZcXHUxZTAwLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMmRcXHUyMTJmLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyYzJlXFx1MmMzMC1cXHUyYzVlXFx1MmM2MC1cXHUyY2U0XFx1MmNlYi1cXHUyY2VlXFx1MmNmMlxcdTJjZjNcXHUyZDAwLVxcdTJkMjVcXHUyZDI3XFx1MmQyZFxcdTJkMzAtXFx1MmQ2N1xcdTJkNmZcXHUyZDgwLVxcdTJkOTZcXHUyZGEwLVxcdTJkYTZcXHUyZGE4LVxcdTJkYWVcXHUyZGIwLVxcdTJkYjZcXHUyZGI4LVxcdTJkYmVcXHUyZGMwLVxcdTJkYzZcXHUyZGM4LVxcdTJkY2VcXHUyZGQwLVxcdTJkZDZcXHUyZGQ4LVxcdTJkZGVcXHUyZTJmXFx1MzAwNS1cXHUzMDA3XFx1MzAyMS1cXHUzMDI5XFx1MzAzMS1cXHUzMDM1XFx1MzAzOC1cXHUzMDNjXFx1MzA0MS1cXHUzMDk2XFx1MzA5ZC1cXHUzMDlmXFx1MzBhMS1cXHUzMGZhXFx1MzBmYy1cXHUzMGZmXFx1MzEwNS1cXHUzMTJkXFx1MzEzMS1cXHUzMThlXFx1MzFhMC1cXHUzMWJhXFx1MzFmMC1cXHUzMWZmXFx1MzQwMC1cXHU0ZGI1XFx1NGUwMC1cXHU5ZmNjXFx1YTAwMC1cXHVhNDhjXFx1YTRkMC1cXHVhNGZkXFx1YTUwMC1cXHVhNjBjXFx1YTYxMC1cXHVhNjFmXFx1YTYyYVxcdWE2MmJcXHVhNjQwLVxcdWE2NmVcXHVhNjdmLVxcdWE2OTdcXHVhNmEwLVxcdWE2ZWZcXHVhNzE3LVxcdWE3MWZcXHVhNzIyLVxcdWE3ODhcXHVhNzhiLVxcdWE3OGVcXHVhNzkwLVxcdWE3OTNcXHVhN2EwLVxcdWE3YWFcXHVhN2Y4LVxcdWE4MDFcXHVhODAzLVxcdWE4MDVcXHVhODA3LVxcdWE4MGFcXHVhODBjLVxcdWE4MjJcXHVhODQwLVxcdWE4NzNcXHVhODgyLVxcdWE4YjNcXHVhOGYyLVxcdWE4ZjdcXHVhOGZiXFx1YTkwYS1cXHVhOTI1XFx1YTkzMC1cXHVhOTQ2XFx1YTk2MC1cXHVhOTdjXFx1YTk4NC1cXHVhOWIyXFx1YTljZlxcdWFhMDAtXFx1YWEyOFxcdWFhNDAtXFx1YWE0MlxcdWFhNDQtXFx1YWE0YlxcdWFhNjAtXFx1YWE3NlxcdWFhN2FcXHVhYTgwLVxcdWFhYWZcXHVhYWIxXFx1YWFiNVxcdWFhYjZcXHVhYWI5LVxcdWFhYmRcXHVhYWMwXFx1YWFjMlxcdWFhZGItXFx1YWFkZFxcdWFhZTAtXFx1YWFlYVxcdWFhZjItXFx1YWFmNFxcdWFiMDEtXFx1YWIwNlxcdWFiMDktXFx1YWIwZVxcdWFiMTEtXFx1YWIxNlxcdWFiMjAtXFx1YWIyNlxcdWFiMjgtXFx1YWIyZVxcdWFiYzAtXFx1YWJlMlxcdWFjMDAtXFx1ZDdhM1xcdWQ3YjAtXFx1ZDdjNlxcdWQ3Y2ItXFx1ZDdmYlxcdWY5MDAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMDAtXFx1ZmIwNlxcdWZiMTMtXFx1ZmIxN1xcdWZiMWRcXHVmYjFmLVxcdWZiMjhcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MFxcdWZiNDFcXHVmYjQzXFx1ZmI0NFxcdWZiNDYtXFx1ZmJiMVxcdWZiZDMtXFx1ZmQzZFxcdWZkNTAtXFx1ZmQ4ZlxcdWZkOTItXFx1ZmRjN1xcdWZkZjAtXFx1ZmRmYlxcdWZlNzAtXFx1ZmU3NFxcdWZlNzYtXFx1ZmVmY1xcdWZmMjEtXFx1ZmYzYVxcdWZmNDEtXFx1ZmY1YVxcdWZmNjYtXFx1ZmZiZVxcdWZmYzItXFx1ZmZjN1xcdWZmY2EtXFx1ZmZjZlxcdWZmZDItXFx1ZmZkN1xcdWZmZGEtXFx1ZmZkY1wiO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyQ2hhcnMgPSBcIlxcdTAzMDAtXFx1MDM2ZlxcdTA0ODMtXFx1MDQ4N1xcdTA1OTEtXFx1MDViZFxcdTA1YmZcXHUwNWMxXFx1MDVjMlxcdTA1YzRcXHUwNWM1XFx1MDVjN1xcdTA2MTAtXFx1MDYxYVxcdTA2MjAtXFx1MDY0OVxcdTA2NzItXFx1MDZkM1xcdTA2ZTctXFx1MDZlOFxcdTA2ZmItXFx1MDZmY1xcdTA3MzAtXFx1MDc0YVxcdTA4MDAtXFx1MDgxNFxcdTA4MWItXFx1MDgyM1xcdTA4MjUtXFx1MDgyN1xcdTA4MjktXFx1MDgyZFxcdTA4NDAtXFx1MDg1N1xcdTA4ZTQtXFx1MDhmZVxcdTA5MDAtXFx1MDkwM1xcdTA5M2EtXFx1MDkzY1xcdTA5M2UtXFx1MDk0ZlxcdTA5NTEtXFx1MDk1N1xcdTA5NjItXFx1MDk2M1xcdTA5NjYtXFx1MDk2ZlxcdTA5ODEtXFx1MDk4M1xcdTA5YmNcXHUwOWJlLVxcdTA5YzRcXHUwOWM3XFx1MDljOFxcdTA5ZDdcXHUwOWRmLVxcdTA5ZTBcXHUwYTAxLVxcdTBhMDNcXHUwYTNjXFx1MGEzZS1cXHUwYTQyXFx1MGE0N1xcdTBhNDhcXHUwYTRiLVxcdTBhNGRcXHUwYTUxXFx1MGE2Ni1cXHUwYTcxXFx1MGE3NVxcdTBhODEtXFx1MGE4M1xcdTBhYmNcXHUwYWJlLVxcdTBhYzVcXHUwYWM3LVxcdTBhYzlcXHUwYWNiLVxcdTBhY2RcXHUwYWUyLVxcdTBhZTNcXHUwYWU2LVxcdTBhZWZcXHUwYjAxLVxcdTBiMDNcXHUwYjNjXFx1MGIzZS1cXHUwYjQ0XFx1MGI0N1xcdTBiNDhcXHUwYjRiLVxcdTBiNGRcXHUwYjU2XFx1MGI1N1xcdTBiNWYtXFx1MGI2MFxcdTBiNjYtXFx1MGI2ZlxcdTBiODJcXHUwYmJlLVxcdTBiYzJcXHUwYmM2LVxcdTBiYzhcXHUwYmNhLVxcdTBiY2RcXHUwYmQ3XFx1MGJlNi1cXHUwYmVmXFx1MGMwMS1cXHUwYzAzXFx1MGM0Ni1cXHUwYzQ4XFx1MGM0YS1cXHUwYzRkXFx1MGM1NVxcdTBjNTZcXHUwYzYyLVxcdTBjNjNcXHUwYzY2LVxcdTBjNmZcXHUwYzgyXFx1MGM4M1xcdTBjYmNcXHUwY2JlLVxcdTBjYzRcXHUwY2M2LVxcdTBjYzhcXHUwY2NhLVxcdTBjY2RcXHUwY2Q1XFx1MGNkNlxcdTBjZTItXFx1MGNlM1xcdTBjZTYtXFx1MGNlZlxcdTBkMDJcXHUwZDAzXFx1MGQ0Ni1cXHUwZDQ4XFx1MGQ1N1xcdTBkNjItXFx1MGQ2M1xcdTBkNjYtXFx1MGQ2ZlxcdTBkODJcXHUwZDgzXFx1MGRjYVxcdTBkY2YtXFx1MGRkNFxcdTBkZDZcXHUwZGQ4LVxcdTBkZGZcXHUwZGYyXFx1MGRmM1xcdTBlMzQtXFx1MGUzYVxcdTBlNDAtXFx1MGU0NVxcdTBlNTAtXFx1MGU1OVxcdTBlYjQtXFx1MGViOVxcdTBlYzgtXFx1MGVjZFxcdTBlZDAtXFx1MGVkOVxcdTBmMThcXHUwZjE5XFx1MGYyMC1cXHUwZjI5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGY0MS1cXHUwZjQ3XFx1MGY3MS1cXHUwZjg0XFx1MGY4Ni1cXHUwZjg3XFx1MGY4ZC1cXHUwZjk3XFx1MGY5OS1cXHUwZmJjXFx1MGZjNlxcdTEwMDAtXFx1MTAyOVxcdTEwNDAtXFx1MTA0OVxcdTEwNjctXFx1MTA2ZFxcdTEwNzEtXFx1MTA3NFxcdTEwODItXFx1MTA4ZFxcdTEwOGYtXFx1MTA5ZFxcdTEzNWQtXFx1MTM1ZlxcdTE3MGUtXFx1MTcxMFxcdTE3MjAtXFx1MTczMFxcdTE3NDAtXFx1MTc1MFxcdTE3NzJcXHUxNzczXFx1MTc4MC1cXHUxN2IyXFx1MTdkZFxcdTE3ZTAtXFx1MTdlOVxcdTE4MGItXFx1MTgwZFxcdTE4MTAtXFx1MTgxOVxcdTE5MjAtXFx1MTkyYlxcdTE5MzAtXFx1MTkzYlxcdTE5NTEtXFx1MTk2ZFxcdTE5YjAtXFx1MTljMFxcdTE5YzgtXFx1MTljOVxcdTE5ZDAtXFx1MTlkOVxcdTFhMDAtXFx1MWExNVxcdTFhMjAtXFx1MWE1M1xcdTFhNjAtXFx1MWE3Y1xcdTFhN2YtXFx1MWE4OVxcdTFhOTAtXFx1MWE5OVxcdTFiNDYtXFx1MWI0YlxcdTFiNTAtXFx1MWI1OVxcdTFiNmItXFx1MWI3M1xcdTFiYjAtXFx1MWJiOVxcdTFiZTYtXFx1MWJmM1xcdTFjMDAtXFx1MWMyMlxcdTFjNDAtXFx1MWM0OVxcdTFjNWItXFx1MWM3ZFxcdTFjZDAtXFx1MWNkMlxcdTFkMDAtXFx1MWRiZVxcdTFlMDEtXFx1MWYxNVxcdTIwMGNcXHUyMDBkXFx1MjAzZlxcdTIwNDBcXHUyMDU0XFx1MjBkMC1cXHUyMGRjXFx1MjBlMVxcdTIwZTUtXFx1MjBmMFxcdTJkODEtXFx1MmQ5NlxcdTJkZTAtXFx1MmRmZlxcdTMwMjEtXFx1MzAyOFxcdTMwOTlcXHUzMDlhXFx1YTY0MC1cXHVhNjZkXFx1YTY3NC1cXHVhNjdkXFx1YTY5ZlxcdWE2ZjAtXFx1YTZmMVxcdWE3ZjgtXFx1YTgwMFxcdWE4MDZcXHVhODBiXFx1YTgyMy1cXHVhODI3XFx1YTg4MC1cXHVhODgxXFx1YThiNC1cXHVhOGM0XFx1YThkMC1cXHVhOGQ5XFx1YThmMy1cXHVhOGY3XFx1YTkwMC1cXHVhOTA5XFx1YTkyNi1cXHVhOTJkXFx1YTkzMC1cXHVhOTQ1XFx1YTk4MC1cXHVhOTgzXFx1YTliMy1cXHVhOWMwXFx1YWEwMC1cXHVhYTI3XFx1YWE0MC1cXHVhYTQxXFx1YWE0Yy1cXHVhYTRkXFx1YWE1MC1cXHVhYTU5XFx1YWE3YlxcdWFhZTAtXFx1YWFlOVxcdWFhZjItXFx1YWFmM1xcdWFiYzAtXFx1YWJlMVxcdWFiZWNcXHVhYmVkXFx1YWJmMC1cXHVhYmY5XFx1ZmIyMC1cXHVmYjI4XFx1ZmUwMC1cXHVmZTBmXFx1ZmUyMC1cXHVmZTI2XFx1ZmUzM1xcdWZlMzRcXHVmZTRkLVxcdWZlNGZcXHVmZjEwLVxcdWZmMTlcXHVmZjNmXCI7XG4gIHZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydCA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgXCJdXCIpO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyID0gbmV3IFJlZ0V4cChcIltcIiArIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgKyBub25BU0NJSWlkZW50aWZpZXJDaGFycyArIFwiXVwiKTtcblxuICAvLyBXaGV0aGVyIGEgc2luZ2xlIGNoYXJhY3RlciBkZW5vdGVzIGEgbmV3bGluZS5cblxuICB2YXIgbmV3bGluZSA9IC9bXFxuXFxyXFx1MjAyOFxcdTIwMjldLztcblxuICAvLyBNYXRjaGVzIGEgd2hvbGUgbGluZSBicmVhayAod2hlcmUgQ1JMRiBpcyBjb25zaWRlcmVkIGEgc2luZ2xlXG4gIC8vIGxpbmUgYnJlYWspLiBVc2VkIHRvIGNvdW50IGxpbmVzLlxuXG4gIHZhciBsaW5lQnJlYWsgPSAvXFxyXFxufFtcXG5cXHJcXHUyMDI4XFx1MjAyOV0vZztcblxuICAvLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgY29kZSBzdGFydHMgYW4gaWRlbnRpZmllci5cblxuICB2YXIgaXNJZGVudGlmaWVyU3RhcnQgPSBleHBvcnRzLmlzSWRlbnRpZmllclN0YXJ0ID0gZnVuY3Rpb24oY29kZSkge1xuICAgIGlmIChjb2RlIDwgNjUpIHJldHVybiBjb2RlID09PSAzNjtcbiAgICBpZiAoY29kZSA8IDkxKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgaWYgKGNvZGUgPCAxMjMpcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGNvZGUgPj0gMHhhYSAmJiBub25BU0NJSWlkZW50aWZpZXJTdGFydC50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkpO1xuICB9O1xuXG4gIC8vIFRlc3Qgd2hldGhlciBhIGdpdmVuIGNoYXJhY3RlciBpcyBwYXJ0IG9mIGFuIGlkZW50aWZpZXIuXG5cbiAgdmFyIGlzSWRlbnRpZmllckNoYXIgPSBleHBvcnRzLmlzSWRlbnRpZmllckNoYXIgPSBmdW5jdGlvbihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPCA0OCkgcmV0dXJuIGNvZGUgPT09IDM2O1xuICAgIGlmIChjb2RlIDwgNTgpIHJldHVybiB0cnVlO1xuICAgIGlmIChjb2RlIDwgNjUpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoY29kZSA8IDkxKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgaWYgKGNvZGUgPCAxMjMpcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGNvZGUgPj0gMHhhYSAmJiBub25BU0NJSWlkZW50aWZpZXIudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpKTtcbiAgfTtcblxuICAvLyAjIyBUb2tlbml6ZXJcblxuICAvLyBUaGVzZSBhcmUgdXNlZCB3aGVuIGBvcHRpb25zLmxvY2F0aW9uc2AgaXMgb24sIGZvciB0aGVcbiAgLy8gYHRva1N0YXJ0TG9jYCBhbmQgYHRva0VuZExvY2AgcHJvcGVydGllcy5cblxuICBmdW5jdGlvbiBQb3NpdGlvbigpIHtcbiAgICB0aGlzLmxpbmUgPSB0b2tDdXJMaW5lO1xuICAgIHRoaXMuY29sdW1uID0gdG9rUG9zIC0gdG9rTGluZVN0YXJ0O1xuICB9XG5cbiAgLy8gUmVzZXQgdGhlIHRva2VuIHN0YXRlLiBVc2VkIGF0IHRoZSBzdGFydCBvZiBhIHBhcnNlLlxuXG4gIGZ1bmN0aW9uIGluaXRUb2tlblN0YXRlKCkge1xuICAgIHRva0N1ckxpbmUgPSAxO1xuICAgIHRva1BvcyA9IHRva0xpbmVTdGFydCA9IDA7XG4gICAgdG9rUmVnZXhwQWxsb3dlZCA9IHRydWU7XG4gICAgc2tpcFNwYWNlKCk7XG4gIH1cblxuICAvLyBDYWxsZWQgYXQgdGhlIGVuZCBvZiBldmVyeSB0b2tlbi4gU2V0cyBgdG9rRW5kYCwgYHRva1ZhbGAsIGFuZFxuICAvLyBgdG9rUmVnZXhwQWxsb3dlZGAsIGFuZCBza2lwcyB0aGUgc3BhY2UgYWZ0ZXIgdGhlIHRva2VuLCBzbyB0aGF0XG4gIC8vIHRoZSBuZXh0IG9uZSdzIGB0b2tTdGFydGAgd2lsbCBwb2ludCBhdCB0aGUgcmlnaHQgcG9zaXRpb24uXG5cbiAgZnVuY3Rpb24gZmluaXNoVG9rZW4odHlwZSwgdmFsKSB7XG4gICAgdG9rRW5kID0gdG9rUG9zO1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykgdG9rRW5kTG9jID0gbmV3IFBvc2l0aW9uO1xuICAgIHRva1R5cGUgPSB0eXBlO1xuICAgIHNraXBTcGFjZSgpO1xuICAgIHRva1ZhbCA9IHZhbDtcbiAgICB0b2tSZWdleHBBbGxvd2VkID0gdHlwZS5iZWZvcmVFeHByO1xuICB9XG5cbiAgZnVuY3Rpb24gc2tpcEJsb2NrQ29tbWVudCgpIHtcbiAgICB2YXIgc3RhcnRMb2MgPSBvcHRpb25zLm9uQ29tbWVudCAmJiBvcHRpb25zLmxvY2F0aW9ucyAmJiBuZXcgUG9zaXRpb247XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zLCBlbmQgPSBpbnB1dC5pbmRleE9mKFwiKi9cIiwgdG9rUG9zICs9IDIpO1xuICAgIGlmIChlbmQgPT09IC0xKSByYWlzZSh0b2tQb3MgLSAyLCBcIlVudGVybWluYXRlZCBjb21tZW50XCIpO1xuICAgIHRva1BvcyA9IGVuZCArIDI7XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICBsaW5lQnJlYWsubGFzdEluZGV4ID0gc3RhcnQ7XG4gICAgICB2YXIgbWF0Y2g7XG4gICAgICB3aGlsZSAoKG1hdGNoID0gbGluZUJyZWFrLmV4ZWMoaW5wdXQpKSAmJiBtYXRjaC5pbmRleCA8IHRva1Bvcykge1xuICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgIHRva0xpbmVTdGFydCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob3B0aW9ucy5vbkNvbW1lbnQpXG4gICAgICBvcHRpb25zLm9uQ29tbWVudCh0cnVlLCBpbnB1dC5zbGljZShzdGFydCArIDIsIGVuZCksIHN0YXJ0LCB0b2tQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydExvYywgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNraXBMaW5lQ29tbWVudCgpIHtcbiAgICB2YXIgc3RhcnQgPSB0b2tQb3M7XG4gICAgdmFyIHN0YXJ0TG9jID0gb3B0aW9ucy5vbkNvbW1lbnQgJiYgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uO1xuICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKz0yKTtcbiAgICB3aGlsZSAodG9rUG9zIDwgaW5wdXRMZW4gJiYgY2ggIT09IDEwICYmIGNoICE9PSAxMyAmJiBjaCAhPT0gODIzMiAmJiBjaCAhPT0gODIzMykge1xuICAgICAgKyt0b2tQb3M7XG4gICAgICBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMub25Db21tZW50KVxuICAgICAgb3B0aW9ucy5vbkNvbW1lbnQoZmFsc2UsIGlucHV0LnNsaWNlKHN0YXJ0ICsgMiwgdG9rUG9zKSwgc3RhcnQsIHRva1BvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TG9jLCBvcHRpb25zLmxvY2F0aW9ucyAmJiBuZXcgUG9zaXRpb24pO1xuICB9XG5cbiAgLy8gQ2FsbGVkIGF0IHRoZSBzdGFydCBvZiB0aGUgcGFyc2UgYW5kIGFmdGVyIGV2ZXJ5IHRva2VuLiBTa2lwc1xuICAvLyB3aGl0ZXNwYWNlIGFuZCBjb21tZW50cywgYW5kLlxuXG4gIGZ1bmN0aW9uIHNraXBTcGFjZSgpIHtcbiAgICB3aGlsZSAodG9rUG9zIDwgaW5wdXRMZW4pIHtcbiAgICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgIGlmIChjaCA9PT0gMzIpIHsgLy8gJyAnXG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gMTMpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgICBpZiAobmV4dCA9PT0gMTApIHtcbiAgICAgICAgICArK3Rva1BvcztcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgICAgdG9rTGluZVN0YXJ0ID0gdG9rUG9zO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAxMCB8fCBjaCA9PT0gODIzMiB8fCBjaCA9PT0gODIzMykge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICAgIHRva0xpbmVTdGFydCA9IHRva1BvcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaCA+IDggJiYgY2ggPCAxNCkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDQ3KSB7IC8vICcvJ1xuICAgICAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgICAgIGlmIChuZXh0ID09PSA0MikgeyAvLyAnKidcbiAgICAgICAgICBza2lwQmxvY2tDb21tZW50KCk7XG4gICAgICAgIH0gZWxzZSBpZiAobmV4dCA9PT0gNDcpIHsgLy8gJy8nXG4gICAgICAgICAgc2tpcExpbmVDb21tZW50KCk7XG4gICAgICAgIH0gZWxzZSBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDE2MCkgeyAvLyAnXFx4YTAnXG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA+PSA1NzYwICYmIG5vbkFTQ0lJd2hpdGVzcGFjZS50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vICMjIyBUb2tlbiByZWFkaW5nXG5cbiAgLy8gVGhpcyBpcyB0aGUgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgdG8gZmV0Y2ggdGhlIG5leHQgdG9rZW4uIEl0XG4gIC8vIGlzIHNvbWV3aGF0IG9ic2N1cmUsIGJlY2F1c2UgaXQgd29ya3MgaW4gY2hhcmFjdGVyIGNvZGVzIHJhdGhlclxuICAvLyB0aGFuIGNoYXJhY3RlcnMsIGFuZCBiZWNhdXNlIG9wZXJhdG9yIHBhcnNpbmcgaGFzIGJlZW4gaW5saW5lZFxuICAvLyBpbnRvIGl0LlxuICAvL1xuICAvLyBBbGwgaW4gdGhlIG5hbWUgb2Ygc3BlZWQuXG4gIC8vXG4gIC8vIFRoZSBgZm9yY2VSZWdleHBgIHBhcmFtZXRlciBpcyB1c2VkIGluIHRoZSBvbmUgY2FzZSB3aGVyZSB0aGVcbiAgLy8gYHRva1JlZ2V4cEFsbG93ZWRgIHRyaWNrIGRvZXMgbm90IHdvcmsuIFNlZSBgcGFyc2VTdGF0ZW1lbnRgLlxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9kb3QoKSB7XG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID49IDQ4ICYmIG5leHQgPD0gNTcpIHJldHVybiByZWFkTnVtYmVyKHRydWUpO1xuICAgIHZhciBuZXh0MiA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMik7XG4gICAgaWYgKG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiBuZXh0ID09PSA0NiAmJiBuZXh0MiA9PT0gNDYpIHsgLy8gNDYgPSBkb3QgJy4nXG4gICAgICB0b2tQb3MgKz0gMztcbiAgICAgIHJldHVybiBmaW5pc2hUb2tlbihfZWxsaXBzaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICArK3Rva1BvcztcbiAgICAgIHJldHVybiBmaW5pc2hUb2tlbihfZG90KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fc2xhc2goKSB7IC8vICcvJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAodG9rUmVnZXhwQWxsb3dlZCkgeysrdG9rUG9zOyByZXR1cm4gcmVhZFJlZ2V4cCgpO31cbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX3NsYXNoLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9tdWx0X21vZHVsbygpIHsgLy8gJyUqJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX211bHRpcGx5TW9kdWxvLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9waXBlX2FtcChjb2RlKSB7IC8vICd8JidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHJldHVybiBmaW5pc2hPcChjb2RlID09PSAxMjQgPyBfbG9naWNhbE9SIDogX2xvZ2ljYWxBTkQsIDIpO1xuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChjb2RlID09PSAxMjQgPyBfYml0d2lzZU9SIDogX2JpdHdpc2VBTkQsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2NhcmV0KCkgeyAvLyAnXidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9iaXR3aXNlWE9SLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9wbHVzX21pbihjb2RlKSB7IC8vICcrLSdcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICAgIGlmIChuZXh0ID09IDQ1ICYmIGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMikgPT0gNjIgJiZcbiAgICAgICAgICBuZXdsaW5lLnRlc3QoaW5wdXQuc2xpY2UobGFzdEVuZCwgdG9rUG9zKSkpIHtcbiAgICAgICAgLy8gQSBgLS0+YCBsaW5lIGNvbW1lbnRcbiAgICAgICAgdG9rUG9zICs9IDM7XG4gICAgICAgIHNraXBMaW5lQ29tbWVudCgpO1xuICAgICAgICBza2lwU3BhY2UoKTtcbiAgICAgICAgcmV0dXJuIHJlYWRUb2tlbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmlzaE9wKF9pbmNEZWMsIDIpO1xuICAgIH1cbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX3BsdXNNaW4sIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2x0X2d0KGNvZGUpIHsgLy8gJzw+J1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICB2YXIgc2l6ZSA9IDE7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICAgIHNpemUgPSBjb2RlID09PSA2MiAmJiBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MiA/IDMgOiAyO1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgc2l6ZSkgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgc2l6ZSArIDEpO1xuICAgICAgcmV0dXJuIGZpbmlzaE9wKF9iaXRTaGlmdCwgc2l6ZSk7XG4gICAgfVxuICAgIGlmIChuZXh0ID09IDMzICYmIGNvZGUgPT0gNjAgJiYgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PSA0NSAmJlxuICAgICAgICBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDMpID09IDQ1KSB7XG4gICAgICAvLyBgPCEtLWAsIGFuIFhNTC1zdHlsZSBjb21tZW50IHRoYXQgc2hvdWxkIGJlIGludGVycHJldGVkIGFzIGEgbGluZSBjb21tZW50XG4gICAgICB0b2tQb3MgKz0gNDtcbiAgICAgIHNraXBMaW5lQ29tbWVudCgpO1xuICAgICAgc2tpcFNwYWNlKCk7XG4gICAgICByZXR1cm4gcmVhZFRva2VuKCk7XG4gICAgfVxuICAgIGlmIChuZXh0ID09PSA2MSlcbiAgICAgIHNpemUgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MSA/IDMgOiAyO1xuICAgIHJldHVybiBmaW5pc2hPcChfcmVsYXRpb25hbCwgc2l6ZSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fZXFfZXhjbChjb2RlKSB7IC8vICc9ISdcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2VxdWFsaXR5LCBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MSA/IDMgOiAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoY29kZSA9PT0gNjEgPyBfZXEgOiBfcHJlZml4LCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRva2VuRnJvbUNvZGUoY29kZSkge1xuICAgIHN3aXRjaChjb2RlKSB7XG4gICAgICAvLyBUaGUgaW50ZXJwcmV0YXRpb24gb2YgYSBkb3QgZGVwZW5kcyBvbiB3aGV0aGVyIGl0IGlzIGZvbGxvd2VkXG4gICAgICAvLyBieSBhIGRpZ2l0IG9yIGFub3RoZXIgdHdvIGRvdHMuXG4gICAgY2FzZSA0NjogLy8gJy4nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2RvdCgpO1xuXG4gICAgICAvLyBQdW5jdHVhdGlvbiB0b2tlbnMuXG4gICAgY2FzZSA0MDogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfcGFyZW5MKTtcbiAgICBjYXNlIDQxOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9wYXJlblIpO1xuICAgIGNhc2UgNTk6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX3NlbWkpO1xuICAgIGNhc2UgNDQ6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2NvbW1hKTtcbiAgICBjYXNlIDkxOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFja2V0TCk7XG4gICAgY2FzZSA5MzogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2tldFIpO1xuICAgIGNhc2UgMTIzOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFjZUwpO1xuICAgIGNhc2UgMTI1OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFjZVIpO1xuICAgIGNhc2UgNTg6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2NvbG9uKTtcbiAgICBjYXNlIDYzOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9xdWVzdGlvbik7XG5cbiAgICAgIC8vICcweCcgaXMgYSBoZXhhZGVjaW1hbCBudW1iZXIuXG4gICAgY2FzZSA0ODogLy8gJzAnXG4gICAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgICBpZiAobmV4dCA9PT0gMTIwIHx8IG5leHQgPT09IDg4KSByZXR1cm4gcmVhZEhleE51bWJlcigpO1xuICAgICAgLy8gQW55dGhpbmcgZWxzZSBiZWdpbm5pbmcgd2l0aCBhIGRpZ2l0IGlzIGFuIGludGVnZXIsIG9jdGFsXG4gICAgICAvLyBudW1iZXIsIG9yIGZsb2F0LlxuICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIDQ5OiBjYXNlIDUwOiBjYXNlIDUxOiBjYXNlIDUyOiBjYXNlIDUzOiBjYXNlIDU0OiBjYXNlIDU1OiBjYXNlIDU2OiBjYXNlIDU3OiAvLyAxLTlcbiAgICAgIHJldHVybiByZWFkTnVtYmVyKGZhbHNlKTtcblxuICAgICAgLy8gUXVvdGVzIHByb2R1Y2Ugc3RyaW5ncy5cbiAgICBjYXNlIDM0OiBjYXNlIDM5OiAvLyAnXCInLCBcIidcIlxuICAgICAgcmV0dXJuIHJlYWRTdHJpbmcoY29kZSk7XG5cbiAgICAvLyBPcGVyYXRvcnMgYXJlIHBhcnNlZCBpbmxpbmUgaW4gdGlueSBzdGF0ZSBtYWNoaW5lcy4gJz0nICg2MSkgaXNcbiAgICAvLyBvZnRlbiByZWZlcnJlZCB0by4gYGZpbmlzaE9wYCBzaW1wbHkgc2tpcHMgdGhlIGFtb3VudCBvZlxuICAgIC8vIGNoYXJhY3RlcnMgaXQgaXMgZ2l2ZW4gYXMgc2Vjb25kIGFyZ3VtZW50LCBhbmQgcmV0dXJucyBhIHRva2VuXG4gICAgLy8gb2YgdGhlIHR5cGUgZ2l2ZW4gYnkgaXRzIGZpcnN0IGFyZ3VtZW50LlxuXG4gICAgY2FzZSA0NzogLy8gJy8nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX3NsYXNoKCk7XG5cbiAgICBjYXNlIDM3OiBjYXNlIDQyOiAvLyAnJSonXG4gICAgICByZXR1cm4gcmVhZFRva2VuX211bHRfbW9kdWxvKCk7XG5cbiAgICBjYXNlIDEyNDogY2FzZSAzODogLy8gJ3wmJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9waXBlX2FtcChjb2RlKTtcblxuICAgIGNhc2UgOTQ6IC8vICdeJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9jYXJldCgpO1xuXG4gICAgY2FzZSA0MzogY2FzZSA0NTogLy8gJystJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9wbHVzX21pbihjb2RlKTtcblxuICAgIGNhc2UgNjA6IGNhc2UgNjI6IC8vICc8PidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fbHRfZ3QoY29kZSk7XG5cbiAgICBjYXNlIDYxOiBjYXNlIDMzOiAvLyAnPSEnXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2VxX2V4Y2woY29kZSk7XG5cbiAgICBjYXNlIDEyNjogLy8gJ34nXG4gICAgICByZXR1cm4gZmluaXNoT3AoX3ByZWZpeCwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuKGZvcmNlUmVnZXhwKSB7XG4gICAgaWYgKCFmb3JjZVJlZ2V4cCkgdG9rU3RhcnQgPSB0b2tQb3M7XG4gICAgZWxzZSB0b2tQb3MgPSB0b2tTdGFydCArIDE7XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB0b2tTdGFydExvYyA9IG5ldyBQb3NpdGlvbjtcbiAgICBpZiAoZm9yY2VSZWdleHApIHJldHVybiByZWFkUmVnZXhwKCk7XG4gICAgaWYgKHRva1BvcyA+PSBpbnB1dExlbikgcmV0dXJuIGZpbmlzaFRva2VuKF9lb2YpO1xuXG4gICAgdmFyIGNvZGUgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgLy8gSWRlbnRpZmllciBvciBrZXl3b3JkLiAnXFx1WFhYWCcgc2VxdWVuY2VzIGFyZSBhbGxvd2VkIGluXG4gICAgLy8gaWRlbnRpZmllcnMsIHNvICdcXCcgYWxzbyBkaXNwYXRjaGVzIHRvIHRoYXQuXG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNvZGUpIHx8IGNvZGUgPT09IDkyIC8qICdcXCcgKi8pIHJldHVybiByZWFkV29yZCgpO1xuXG4gICAgdmFyIHRvayA9IGdldFRva2VuRnJvbUNvZGUoY29kZSk7XG5cbiAgICBpZiAodG9rID09PSBmYWxzZSkge1xuICAgICAgLy8gSWYgd2UgYXJlIGhlcmUsIHdlIGVpdGhlciBmb3VuZCBhIG5vbi1BU0NJSSBpZGVudGlmaWVyXG4gICAgICAvLyBjaGFyYWN0ZXIsIG9yIHNvbWV0aGluZyB0aGF0J3MgZW50aXJlbHkgZGlzYWxsb3dlZC5cbiAgICAgIHZhciBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiIHx8IG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0LnRlc3QoY2gpKSByZXR1cm4gcmVhZFdvcmQoKTtcbiAgICAgIHJhaXNlKHRva1BvcywgXCJVbmV4cGVjdGVkIGNoYXJhY3RlciAnXCIgKyBjaCArIFwiJ1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRvaztcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmlzaE9wKHR5cGUsIHNpemUpIHtcbiAgICB2YXIgc3RyID0gaW5wdXQuc2xpY2UodG9rUG9zLCB0b2tQb3MgKyBzaXplKTtcbiAgICB0b2tQb3MgKz0gc2l6ZTtcbiAgICBmaW5pc2hUb2tlbih0eXBlLCBzdHIpO1xuICB9XG5cbiAgLy8gUGFyc2UgYSByZWd1bGFyIGV4cHJlc3Npb24uIFNvbWUgY29udGV4dC1hd2FyZW5lc3MgaXMgbmVjZXNzYXJ5LFxuICAvLyBzaW5jZSBhICcvJyBpbnNpZGUgYSAnW10nIHNldCBkb2VzIG5vdCBlbmQgdGhlIGV4cHJlc3Npb24uXG5cbiAgZnVuY3Rpb24gcmVhZFJlZ2V4cCgpIHtcbiAgICB2YXIgY29udGVudCA9IFwiXCIsIGVzY2FwZWQsIGluQ2xhc3MsIHN0YXJ0ID0gdG9rUG9zO1xuICAgIGZvciAoOzspIHtcbiAgICAgIGlmICh0b2tQb3MgPj0gaW5wdXRMZW4pIHJhaXNlKHN0YXJ0LCBcIlVudGVybWluYXRlZCByZWd1bGFyIGV4cHJlc3Npb25cIik7XG4gICAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQXQodG9rUG9zKTtcbiAgICAgIGlmIChuZXdsaW5lLnRlc3QoY2gpKSByYWlzZShzdGFydCwgXCJVbnRlcm1pbmF0ZWQgcmVndWxhciBleHByZXNzaW9uXCIpO1xuICAgICAgaWYgKCFlc2NhcGVkKSB7XG4gICAgICAgIGlmIChjaCA9PT0gXCJbXCIpIGluQ2xhc3MgPSB0cnVlO1xuICAgICAgICBlbHNlIGlmIChjaCA9PT0gXCJdXCIgJiYgaW5DbGFzcykgaW5DbGFzcyA9IGZhbHNlO1xuICAgICAgICBlbHNlIGlmIChjaCA9PT0gXCIvXCIgJiYgIWluQ2xhc3MpIGJyZWFrO1xuICAgICAgICBlc2NhcGVkID0gY2ggPT09IFwiXFxcXFwiO1xuICAgICAgfSBlbHNlIGVzY2FwZWQgPSBmYWxzZTtcbiAgICAgICsrdG9rUG9zO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICAgICsrdG9rUG9zO1xuICAgIC8vIE5lZWQgdG8gdXNlIGByZWFkV29yZDFgIGJlY2F1c2UgJ1xcdVhYWFgnIHNlcXVlbmNlcyBhcmUgYWxsb3dlZFxuICAgIC8vIGhlcmUgKGRvbid0IGFzaykuXG4gICAgdmFyIG1vZHMgPSByZWFkV29yZDEoKTtcbiAgICBpZiAobW9kcyAmJiAhL15bZ21zaXldKiQvLnRlc3QobW9kcykpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdcIik7XG4gICAgdHJ5IHtcbiAgICAgIHZhciB2YWx1ZSA9IG5ldyBSZWdFeHAoY29udGVudCwgbW9kcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikgcmFpc2Uoc3RhcnQsIFwiRXJyb3IgcGFyc2luZyByZWd1bGFyIGV4cHJlc3Npb246IFwiICsgZS5tZXNzYWdlKTtcbiAgICAgIHJhaXNlKGUpO1xuICAgIH1cbiAgICByZXR1cm4gZmluaXNoVG9rZW4oX3JlZ2V4cCwgdmFsdWUpO1xuICB9XG5cbiAgLy8gUmVhZCBhbiBpbnRlZ2VyIGluIHRoZSBnaXZlbiByYWRpeC4gUmV0dXJuIG51bGwgaWYgemVybyBkaWdpdHNcbiAgLy8gd2VyZSByZWFkLCB0aGUgaW50ZWdlciB2YWx1ZSBvdGhlcndpc2UuIFdoZW4gYGxlbmAgaXMgZ2l2ZW4sIHRoaXNcbiAgLy8gd2lsbCByZXR1cm4gYG51bGxgIHVubGVzcyB0aGUgaW50ZWdlciBoYXMgZXhhY3RseSBgbGVuYCBkaWdpdHMuXG5cbiAgZnVuY3Rpb24gcmVhZEludChyYWRpeCwgbGVuKSB7XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zLCB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDAsIGUgPSBsZW4gPT0gbnVsbCA/IEluZmluaXR5IDogbGVuOyBpIDwgZTsgKytpKSB7XG4gICAgICB2YXIgY29kZSA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSwgdmFsO1xuICAgICAgaWYgKGNvZGUgPj0gOTcpIHZhbCA9IGNvZGUgLSA5NyArIDEwOyAvLyBhXG4gICAgICBlbHNlIGlmIChjb2RlID49IDY1KSB2YWwgPSBjb2RlIC0gNjUgKyAxMDsgLy8gQVxuICAgICAgZWxzZSBpZiAoY29kZSA+PSA0OCAmJiBjb2RlIDw9IDU3KSB2YWwgPSBjb2RlIC0gNDg7IC8vIDAtOVxuICAgICAgZWxzZSB2YWwgPSBJbmZpbml0eTtcbiAgICAgIGlmICh2YWwgPj0gcmFkaXgpIGJyZWFrO1xuICAgICAgKyt0b2tQb3M7XG4gICAgICB0b3RhbCA9IHRvdGFsICogcmFkaXggKyB2YWw7XG4gICAgfVxuICAgIGlmICh0b2tQb3MgPT09IHN0YXJ0IHx8IGxlbiAhPSBudWxsICYmIHRva1BvcyAtIHN0YXJ0ICE9PSBsZW4pIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIHRvdGFsO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEhleE51bWJlcigpIHtcbiAgICB0b2tQb3MgKz0gMjsgLy8gMHhcbiAgICB2YXIgdmFsID0gcmVhZEludCgxNik7XG4gICAgaWYgKHZhbCA9PSBudWxsKSByYWlzZSh0b2tTdGFydCArIDIsIFwiRXhwZWN0ZWQgaGV4YWRlY2ltYWwgbnVtYmVyXCIpO1xuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykpKSByYWlzZSh0b2tQb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKF9udW0sIHZhbCk7XG4gIH1cblxuICAvLyBSZWFkIGFuIGludGVnZXIsIG9jdGFsIGludGVnZXIsIG9yIGZsb2F0aW5nLXBvaW50IG51bWJlci5cblxuICBmdW5jdGlvbiByZWFkTnVtYmVyKHN0YXJ0c1dpdGhEb3QpIHtcbiAgICB2YXIgc3RhcnQgPSB0b2tQb3MsIGlzRmxvYXQgPSBmYWxzZSwgb2N0YWwgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykgPT09IDQ4O1xuICAgIGlmICghc3RhcnRzV2l0aERvdCAmJiByZWFkSW50KDEwKSA9PT0gbnVsbCkgcmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSA9PT0gNDYpIHtcbiAgICAgICsrdG9rUG9zO1xuICAgICAgcmVhZEludCgxMCk7XG4gICAgICBpc0Zsb2F0ID0gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgaWYgKG5leHQgPT09IDY5IHx8IG5leHQgPT09IDEwMSkgeyAvLyAnZUUnXG4gICAgICBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCgrK3Rva1Bvcyk7XG4gICAgICBpZiAobmV4dCA9PT0gNDMgfHwgbmV4dCA9PT0gNDUpICsrdG9rUG9zOyAvLyAnKy0nXG4gICAgICBpZiAocmVhZEludCgxMCkgPT09IG51bGwpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpO1xuICAgICAgaXNGbG9hdCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykpKSByYWlzZSh0b2tQb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7XG5cbiAgICB2YXIgc3RyID0gaW5wdXQuc2xpY2Uoc3RhcnQsIHRva1BvcyksIHZhbDtcbiAgICBpZiAoaXNGbG9hdCkgdmFsID0gcGFyc2VGbG9hdChzdHIpO1xuICAgIGVsc2UgaWYgKCFvY3RhbCB8fCBzdHIubGVuZ3RoID09PSAxKSB2YWwgPSBwYXJzZUludChzdHIsIDEwKTtcbiAgICBlbHNlIGlmICgvWzg5XS8udGVzdChzdHIpIHx8IHN0cmljdCkgcmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7XG4gICAgZWxzZSB2YWwgPSBwYXJzZUludChzdHIsIDgpO1xuICAgIHJldHVybiBmaW5pc2hUb2tlbihfbnVtLCB2YWwpO1xuICB9XG5cbiAgLy8gUmVhZCBhIHN0cmluZyB2YWx1ZSwgaW50ZXJwcmV0aW5nIGJhY2tzbGFzaC1lc2NhcGVzLlxuXG4gIGZ1bmN0aW9uIHJlYWRTdHJpbmcocXVvdGUpIHtcbiAgICB0b2tQb3MrKztcbiAgICB2YXIgb3V0ID0gXCJcIjtcbiAgICBmb3IgKDs7KSB7XG4gICAgICBpZiAodG9rUG9zID49IGlucHV0TGVuKSByYWlzZSh0b2tTdGFydCwgXCJVbnRlcm1pbmF0ZWQgc3RyaW5nIGNvbnN0YW50XCIpO1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgcmV0dXJuIGZpbmlzaFRva2VuKF9zdHJpbmcsIG91dCk7XG4gICAgICB9XG4gICAgICBpZiAoY2ggPT09IDkyKSB7IC8vICdcXCdcbiAgICAgICAgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KCsrdG9rUG9zKTtcbiAgICAgICAgdmFyIG9jdGFsID0gL15bMC03XSsvLmV4ZWMoaW5wdXQuc2xpY2UodG9rUG9zLCB0b2tQb3MgKyAzKSk7XG4gICAgICAgIGlmIChvY3RhbCkgb2N0YWwgPSBvY3RhbFswXTtcbiAgICAgICAgd2hpbGUgKG9jdGFsICYmIHBhcnNlSW50KG9jdGFsLCA4KSA+IDI1NSkgb2N0YWwgPSBvY3RhbC5zbGljZSgwLCAtMSk7XG4gICAgICAgIGlmIChvY3RhbCA9PT0gXCIwXCIpIG9jdGFsID0gbnVsbDtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIGlmIChvY3RhbCkge1xuICAgICAgICAgIGlmIChzdHJpY3QpIHJhaXNlKHRva1BvcyAtIDIsIFwiT2N0YWwgbGl0ZXJhbCBpbiBzdHJpY3QgbW9kZVwiKTtcbiAgICAgICAgICBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChvY3RhbCwgOCkpO1xuICAgICAgICAgIHRva1BvcyArPSBvY3RhbC5sZW5ndGggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICBjYXNlIDExMDogb3V0ICs9IFwiXFxuXCI7IGJyZWFrOyAvLyAnbicgLT4gJ1xcbidcbiAgICAgICAgICBjYXNlIDExNDogb3V0ICs9IFwiXFxyXCI7IGJyZWFrOyAvLyAncicgLT4gJ1xccidcbiAgICAgICAgICBjYXNlIDEyMDogb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocmVhZEhleENoYXIoMikpOyBicmVhazsgLy8gJ3gnXG4gICAgICAgICAgY2FzZSAxMTc6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJlYWRIZXhDaGFyKDQpKTsgYnJlYWs7IC8vICd1J1xuICAgICAgICAgIGNhc2UgODU6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJlYWRIZXhDaGFyKDgpKTsgYnJlYWs7IC8vICdVJ1xuICAgICAgICAgIGNhc2UgMTE2OiBvdXQgKz0gXCJcXHRcIjsgYnJlYWs7IC8vICd0JyAtPiAnXFx0J1xuICAgICAgICAgIGNhc2UgOTg6IG91dCArPSBcIlxcYlwiOyBicmVhazsgLy8gJ2InIC0+ICdcXGInXG4gICAgICAgICAgY2FzZSAxMTg6IG91dCArPSBcIlxcdTAwMGJcIjsgYnJlYWs7IC8vICd2JyAtPiAnXFx1MDAwYidcbiAgICAgICAgICBjYXNlIDEwMjogb3V0ICs9IFwiXFxmXCI7IGJyZWFrOyAvLyAnZicgLT4gJ1xcZidcbiAgICAgICAgICBjYXNlIDQ4OiBvdXQgKz0gXCJcXDBcIjsgYnJlYWs7IC8vIDAgLT4gJ1xcMCdcbiAgICAgICAgICBjYXNlIDEzOiBpZiAoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpID09PSAxMCkgKyt0b2tQb3M7IC8vICdcXHJcXG4nXG4gICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgIGNhc2UgMTA6IC8vICcgXFxuJ1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7IHRva0xpbmVTdGFydCA9IHRva1BvczsgKyt0b2tDdXJMaW5lOyB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OiBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7IGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNoID09PSAxMyB8fCBjaCA9PT0gMTAgfHwgY2ggPT09IDgyMzIgfHwgY2ggPT09IDgyMzMpIHJhaXNlKHRva1N0YXJ0LCBcIlVudGVybWluYXRlZCBzdHJpbmcgY29uc3RhbnRcIik7XG4gICAgICAgIG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKTsgLy8gJ1xcJ1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBVc2VkIHRvIHJlYWQgY2hhcmFjdGVyIGVzY2FwZSBzZXF1ZW5jZXMgKCdcXHgnLCAnXFx1JywgJ1xcVScpLlxuXG4gIGZ1bmN0aW9uIHJlYWRIZXhDaGFyKGxlbikge1xuICAgIHZhciBuID0gcmVhZEludCgxNiwgbGVuKTtcbiAgICBpZiAobiA9PT0gbnVsbCkgcmFpc2UodG9rU3RhcnQsIFwiQmFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VcIik7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICAvLyBVc2VkIHRvIHNpZ25hbCB0byBjYWxsZXJzIG9mIGByZWFkV29yZDFgIHdoZXRoZXIgdGhlIHdvcmRcbiAgLy8gY29udGFpbmVkIGFueSBlc2NhcGUgc2VxdWVuY2VzLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIHdvcmRzIHdpdGhcbiAgLy8gZXNjYXBlIHNlcXVlbmNlcyBtdXN0IG5vdCBiZSBpbnRlcnByZXRlZCBhcyBrZXl3b3Jkcy5cblxuICB2YXIgY29udGFpbnNFc2M7XG5cbiAgLy8gUmVhZCBhbiBpZGVudGlmaWVyLCBhbmQgcmV0dXJuIGl0IGFzIGEgc3RyaW5nLiBTZXRzIGBjb250YWluc0VzY2BcbiAgLy8gdG8gd2hldGhlciB0aGUgd29yZCBjb250YWluZWQgYSAnXFx1JyBlc2NhcGUuXG4gIC8vXG4gIC8vIE9ubHkgYnVpbGRzIHVwIHRoZSB3b3JkIGNoYXJhY3Rlci1ieS1jaGFyYWN0ZXIgd2hlbiBpdCBhY3R1YWxseVxuICAvLyBjb250YWluZWRzIGFuIGVzY2FwZSwgYXMgYSBtaWNyby1vcHRpbWl6YXRpb24uXG5cbiAgZnVuY3Rpb24gcmVhZFdvcmQxKCkge1xuICAgIGNvbnRhaW5zRXNjID0gZmFsc2U7XG4gICAgdmFyIHdvcmQsIGZpcnN0ID0gdHJ1ZSwgc3RhcnQgPSB0b2tQb3M7XG4gICAgZm9yICg7Oykge1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgaWYgKGlzSWRlbnRpZmllckNoYXIoY2gpKSB7XG4gICAgICAgIGlmIChjb250YWluc0VzYykgd29yZCArPSBpbnB1dC5jaGFyQXQodG9rUG9zKTtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSA5MikgeyAvLyBcIlxcXCJcbiAgICAgICAgaWYgKCFjb250YWluc0VzYykgd29yZCA9IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICAgICAgICBjb250YWluc0VzYyA9IHRydWU7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KCsrdG9rUG9zKSAhPSAxMTcpIC8vIFwidVwiXG4gICAgICAgICAgcmFpc2UodG9rUG9zLCBcIkV4cGVjdGluZyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZSBcXFxcdVhYWFhcIik7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICB2YXIgZXNjID0gcmVhZEhleENoYXIoNCk7XG4gICAgICAgIHZhciBlc2NTdHIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGVzYyk7XG4gICAgICAgIGlmICghZXNjU3RyKSByYWlzZSh0b2tQb3MgLSAxLCBcIkludmFsaWQgVW5pY29kZSBlc2NhcGVcIik7XG4gICAgICAgIGlmICghKGZpcnN0ID8gaXNJZGVudGlmaWVyU3RhcnQoZXNjKSA6IGlzSWRlbnRpZmllckNoYXIoZXNjKSkpXG4gICAgICAgICAgcmFpc2UodG9rUG9zIC0gNCwgXCJJbnZhbGlkIFVuaWNvZGUgZXNjYXBlXCIpO1xuICAgICAgICB3b3JkICs9IGVzY1N0cjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5zRXNjID8gd29yZCA6IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICB9XG5cbiAgLy8gUmVhZCBhbiBpZGVudGlmaWVyIG9yIGtleXdvcmQgdG9rZW4uIFdpbGwgY2hlY2sgZm9yIHJlc2VydmVkXG4gIC8vIHdvcmRzIHdoZW4gbmVjZXNzYXJ5LlxuXG4gIGZ1bmN0aW9uIHJlYWRXb3JkKCkge1xuICAgIHZhciB3b3JkID0gcmVhZFdvcmQxKCk7XG4gICAgdmFyIHR5cGUgPSBfbmFtZTtcbiAgICBpZiAoIWNvbnRhaW5zRXNjICYmIGlzS2V5d29yZCh3b3JkKSlcbiAgICAgIHR5cGUgPSBrZXl3b3JkVHlwZXNbd29yZF07XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKHR5cGUsIHdvcmQpO1xuICB9XG5cblxuZXhwb3J0IGRlZmF1bHQgeyB0b2tlbml6ZTogZXhwb3J0cy50b2tlbml6ZSB9OyIsIi8vIFJlYm91bmQgSGVscGVyc1xuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgTGF6eVZhbHVlIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlXCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuXG52YXIgaGVscGVycyAgPSB7fSxcbiAgICBwYXJ0aWFscyA9IHt9O1xuXG5oZWxwZXJzLnJlZ2lzdGVyUGFydGlhbCA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpe1xuICBpZihmdW5jICYmIGZ1bmMuaXNIVE1MQmFycyAmJiB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpe1xuICAgIHBhcnRpYWxzW25hbWVdID0gZnVuYztcbiAgfVxufTtcblxuLy8gbG9va3VwSGVscGVyIHJldHVybnMgdGhlIGdpdmVuIGZ1bmN0aW9uIGZyb20gdGhlIGhlbHBlcnMgb2JqZWN0LiBNYW51YWwgY2hlY2tzIHByZXZlbnQgdXNlciBmcm9tIG92ZXJyaWRpbmcgcmVzZXJ2ZWQgd29yZHMuXG5oZWxwZXJzLmxvb2t1cEhlbHBlciA9IGZ1bmN0aW9uKG5hbWUsIGVudikge1xuICAoZW52ICYmIGVudi5oZWxwZXJzKSB8fCAoZW52ID0ge2hlbHBlcnM6e319KTtcbiAgLy8gSWYgYSByZXNlcnZlZCBoZWxwZXIsIHJldHVybiBpdFxuICBpZihuYW1lID09PSAnYXR0cmlidXRlJykgeyByZXR1cm4gdGhpcy5hdHRyaWJ1dGU7IH1cbiAgaWYobmFtZSA9PT0gJ2lmJykgeyByZXR1cm4gdGhpcy5pZjsgfVxuICBpZihuYW1lID09PSAndW5sZXNzJykgeyByZXR1cm4gdGhpcy51bmxlc3M7IH1cbiAgaWYobmFtZSA9PT0gJ2VhY2gnKSB7IHJldHVybiB0aGlzLmVhY2g7IH1cbiAgaWYobmFtZSA9PT0gJ3BhcnRpYWwnKSB7IHJldHVybiB0aGlzLnBhcnRpYWw7IH1cbiAgaWYobmFtZSA9PT0gJ29uJykgeyByZXR1cm4gdGhpcy5vbjsgfVxuICBpZihuYW1lID09PSAnZGVidWdnZXInKSB7IHJldHVybiB0aGlzLmRlYnVnZ2VyOyB9XG4gIGlmKG5hbWUgPT09ICdsb2cnKSB7IHJldHVybiB0aGlzLmxvZzsgfVxuXG4gIC8vIElmIG5vdCBhIHJlc2VydmVkIGhlbHBlciwgY2hlY2sgZW52LCB0aGVuIGdsb2JhbCBoZWxwZXJzLCBlbHNlIHJldHVybiBmYWxzZVxuICByZXR1cm4gZW52LmhlbHBlcnNbbmFtZV0gfHwgaGVscGVyc1tuYW1lXSB8fCBmYWxzZTtcbn07XG5cbmhlbHBlcnMucmVnaXN0ZXJIZWxwZXIgPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgcGFyYW1zKXtcbiAgaWYoIV8uaXNTdHJpbmcobmFtZSkpe1xuICAgIGNvbnNvbGUuZXJyb3IoJ05hbWUgcHJvdmlkZWQgdG8gcmVnaXN0ZXJIZWxwZXIgbXVzdCBiZSBhIHN0cmluZyEnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYoIV8uaXNGdW5jdGlvbihjYWxsYmFjaykpe1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NhbGxiYWNrIHByb3ZpZGVkIHRvIHJlZ2llckhlbHBlciBtdXN0IGJlIGEgZnVuY3Rpb24hJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmKGhlbHBlcnMubG9va3VwSGVscGVyKG5hbWUpKXtcbiAgICBjb25zb2xlLmVycm9yKCdBIGhlbHBlciBjYWxsZWQgXCInICsgbmFtZSArICdcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQhJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcGFyYW1zID0gKF8uaXNBcnJheShwYXJhbXMpKSA/IHBhcmFtcyA6IFtwYXJhbXNdO1xuICBjYWxsYmFjay5fX3BhcmFtcyA9IHBhcmFtcztcblxuICBoZWxwZXJzW25hbWVdID0gY2FsbGJhY2s7XG5cbn07XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIERlZmF1bHQgaGVscGVyc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmhlbHBlcnMuZGVidWdnZXIgPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIGRlYnVnZ2VyO1xuICByZXR1cm4gJyc7XG59XG5cbmhlbHBlcnMubG9nID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBwYXJhbXMpO1xuICByZXR1cm4gJyc7XG59XG5cbmhlbHBlcnMub24gPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIHZhciBpLCBjYWxsYmFjaywgZGVsZWdhdGUsIGVsZW1lbnQsXG4gICAgICBldmVudE5hbWUgPSBwYXJhbXNbMF0sXG4gICAgICBsZW4gPSBwYXJhbXMubGVuZ3RoLFxuICAgICAgZGF0YSA9IGhhc2g7XG5cbiAgLy8gQnkgZGVmYXVsdCBldmVyeXRoaW5nIGlzIGRlbGVnYXRlZCBvbiB0aGUgcGFyZW50IGNvbXBvbmVudFxuICBpZihsZW4gPT09IDIpe1xuICAgIGNhbGxiYWNrID0gcGFyYW1zWzFdO1xuICAgIGRlbGVnYXRlID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIGVsZW1lbnQgPSAodGhpcy5lbCB8fCBvcHRpb25zLmVsZW1lbnQpO1xuICB9XG4gIC8vIElmIGEgc2VsZWN0b3IgaXMgcHJvdmlkZWQsIGRlbGVnYXRlIG9uIHRoZSBoZWxwZXIncyBlbGVtZW50XG4gIGVsc2UgaWYobGVuID09PSAzKXtcbiAgICBjYWxsYmFjayA9IHBhcmFtc1syXTtcbiAgICBkZWxlZ2F0ZSA9IHBhcmFtc1sxXTtcbiAgICBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICB9XG5cbiAgLy8gQXR0YWNoIGV2ZW50XG4gICQoZWxlbWVudCkub24oZXZlbnROYW1lLCBkZWxlZ2F0ZSwgaGFzaCwgZnVuY3Rpb24oZXZlbnQpe1xuICAgIHJldHVybiBlbnYuaGVscGVycy5fX2NhbGxPbkNvbXBvbmVudChjYWxsYmFjaywgZXZlbnQpO1xuICB9KTtcbn07XG5cbmhlbHBlcnMubGVuZ3RoID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICAgIHJldHVybiBwYXJhbXNbMF0gJiYgcGFyYW1zWzBdLmxlbmd0aCB8fCAwO1xufTtcblxuaGVscGVycy5pZiA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcblxuICB2YXIgY29uZGl0aW9uID0gcGFyYW1zWzBdO1xuXG4gIGlmKGNvbmRpdGlvbiA9PT0gdW5kZWZpbmVkKXtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmKGNvbmRpdGlvbi5pc01vZGVsKXtcbiAgICBjb25kaXRpb24gPSB0cnVlO1xuICB9XG5cbiAgLy8gSWYgb3VyIGNvbmRpdGlvbiBpcyBhbiBhcnJheSwgaGFuZGxlIHByb3Blcmx5XG4gIGlmKF8uaXNBcnJheShjb25kaXRpb24pIHx8IGNvbmRpdGlvbi5pc0NvbGxlY3Rpb24pe1xuICAgIGNvbmRpdGlvbiA9IGNvbmRpdGlvbi5sZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICBpZihjb25kaXRpb24gPT09ICd0cnVlJyl7IGNvbmRpdGlvbiA9IHRydWU7IH1cbiAgaWYoY29uZGl0aW9uID09PSAnZmFsc2UnKXsgY29uZGl0aW9uID0gZmFsc2U7IH1cblxuICAvLyBJZiBtb3JlIHRoYW4gb25lIHBhcmFtLCB0aGlzIGlzIG5vdCBhIGJsb2NrIGhlbHBlci4gRXZhbCBhcyBzdWNoLlxuICBpZihwYXJhbXMubGVuZ3RoID4gMSl7XG4gICAgcmV0dXJuIChjb25kaXRpb24pID8gcGFyYW1zWzFdIDogKCBwYXJhbXNbMl0gfHwgJycpO1xuICB9XG5cbiAgLy8gQ2hlY2sgb3VyIGNhY2hlLiBJZiB0aGUgdmFsdWUgaGFzbid0IGFjdHVhbGx5IGNoYW5nZWQsIGRvbid0IGV2YWx1YXRlLiBJbXBvcnRhbnQgZm9yIHJlLXJlbmRlcmluZyBvZiAjZWFjaCBoZWxwZXJzLlxuICBpZihvcHRpb25zLm1vcnBoLl9faWZDYWNoZSA9PT0gY29uZGl0aW9uKXtcbiAgICByZXR1cm4gbnVsbDsgLy8gUmV0dXJuIG51bGwgcHJldmVudCdzIHJlLXJlbmRpbmcgb2Ygb3VyIHBsYWNlaG9sZGVyLlxuICB9XG5cbiAgb3B0aW9ucy5tb3JwaC5fX2lmQ2FjaGUgPSBjb25kaXRpb247XG5cbiAgLy8gUmVuZGVyIHRoZSBhcHJvcHJlYXRlIGJsb2NrIHN0YXRlbWVudFxuICBpZihjb25kaXRpb24gJiYgb3B0aW9ucy50ZW1wbGF0ZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52LCBvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50KTtcbiAgfVxuICBlbHNlIGlmKCFjb25kaXRpb24gJiYgb3B0aW9ucy5pbnZlcnNlKXtcbiAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudiwgb3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCk7XG4gIH1cblxuICByZXR1cm4gJyc7XG59O1xuXG5cbi8vIFRPRE86IFByb3h5IHRvIGlmIGhlbHBlciB3aXRoIGludmVydGVkIHBhcmFtc1xuaGVscGVycy51bmxlc3MgPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIHZhciBjb25kaXRpb24gPSBwYXJhbXNbMF07XG5cbiAgaWYoY29uZGl0aW9uID09PSB1bmRlZmluZWQpe1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYoY29uZGl0aW9uLmlzTW9kZWwpe1xuICAgIGNvbmRpdGlvbiA9IHRydWU7XG4gIH1cblxuICAvLyBJZiBvdXIgY29uZGl0aW9uIGlzIGFuIGFycmF5LCBoYW5kbGUgcHJvcGVybHlcbiAgaWYoXy5pc0FycmF5KGNvbmRpdGlvbikgfHwgY29uZGl0aW9uLmlzQ29sbGVjdGlvbil7XG4gICAgY29uZGl0aW9uID0gY29uZGl0aW9uLmxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuXG4gIC8vIElmIG1vcmUgdGhhbiBvbmUgcGFyYW0sIHRoaXMgaXMgbm90IGEgYmxvY2sgaGVscGVyLiBFdmFsIGFzIHN1Y2guXG4gIGlmKHBhcmFtcy5sZW5ndGggPiAxKXtcbiAgICByZXR1cm4gKCFjb25kaXRpb24pID8gcGFyYW1zWzFdIDogKCBwYXJhbXNbMl0gfHwgJycpO1xuICB9XG5cbiAgLy8gQ2hlY2sgb3VyIGNhY2hlLiBJZiB0aGUgdmFsdWUgaGFzbid0IGFjdHVhbGx5IGNoYW5nZWQsIGRvbid0IGV2YWx1YXRlLiBJbXBvcnRhbnQgZm9yIHJlLXJlbmRlcmluZyBvZiAjZWFjaCBoZWxwZXJzLlxuICBpZihvcHRpb25zLm1vcnBoLl9fdW5sZXNzQ2FjaGUgPT09IGNvbmRpdGlvbil7XG4gICAgcmV0dXJuIG51bGw7IC8vIFJldHVybiBudWxsIHByZXZlbnQncyByZS1yZW5kaW5nIG9mIG91ciBwbGFjZWhvbGRlci5cbiAgfVxuXG4gIG9wdGlvbnMubW9ycGguX191bmxlc3NDYWNoZSA9IGNvbmRpdGlvbjtcblxuICAvLyBSZW5kZXIgdGhlIGFwcm9wcmVhdGUgYmxvY2sgc3RhdGVtZW50XG4gIGlmKCFjb25kaXRpb24gJiYgIG9wdGlvbnMudGVtcGxhdGUpe1xuICAgIHJldHVybiBvcHRpb25zLnRlbXBsYXRlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudiwgb3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCk7XG4gIH1cbiAgZWxzZSBpZihjb25kaXRpb24gJiYgb3B0aW9ucy5pbnZlcnNlKXtcbiAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudiwgb3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCk7XG4gIH1cblxuICByZXR1cm4gJyc7XG59O1xuXG4vLyBHaXZlbiBhbiBhcnJheSwgcHJlZGljYXRlIGFuZCBvcHRpb25hbCBleHRyYSB2YXJpYWJsZSwgZmluZHMgdGhlIGluZGV4IGluIHRoZSBhcnJheSB3aGVyZSBwcmVkaWNhdGUgaXMgdHJ1ZVxuZnVuY3Rpb24gZmluZEluZGV4KGFyciwgcHJlZGljYXRlLCBjaWQpIHtcbiAgaWYgKGFyciA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZmluZEluZGV4IGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xuICB9XG4gIGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncHJlZGljYXRlIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG4gIHZhciBsaXN0ID0gT2JqZWN0KGFycik7XG4gIHZhciBsZW5ndGggPSBsaXN0Lmxlbmd0aCA+Pj4gMDtcbiAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gIHZhciB2YWx1ZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFsdWUgPSBsaXN0W2ldO1xuICAgIGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaSwgbGlzdCwgY2lkKSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuaGVscGVycy5lYWNoID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuXG4gIGlmKF8uaXNOdWxsKHBhcmFtc1swXSkgfHwgXy5pc1VuZGVmaW5lZChwYXJhbXNbMF0pKXsgY29uc29sZS53YXJuKCdVbmRlZmluZWQgdmFsdWUgcGFzc2VkIHRvIGVhY2ggaGVscGVyISBNYXliZSB0cnkgcHJvdmlkaW5nIGEgZGVmYXVsdCB2YWx1ZT8nLCBvcHRpb25zLmNvbnRleHQpOyByZXR1cm4gbnVsbDsgfVxuXG4gIHZhciB2YWx1ZSA9IChwYXJhbXNbMF0uaXNDb2xsZWN0aW9uKSA/IHBhcmFtc1swXS5tb2RlbHMgOiBwYXJhbXNbMF0sIC8vIEFjY2VwdHMgY29sbGVjdGlvbnMgb3IgYXJyYXlzXG4gICAgICBtb3JwaCA9IG9wdGlvbnMubW9ycGguZmlyc3RDaGlsZE1vcnBoLCBvYmosIG5leHQsIGxhenlWYWx1ZSwgbm1vcnBoLCBpLCAgLy8gdXNlZCBiZWxvdyB0byByZW1vdmUgdHJhaWxpbmcganVuayBtb3JwaHMgZnJvbSB0aGUgZG9tXG4gICAgICBwb3NpdGlvbiwgLy8gU3RvcmVzIHRoZSBpdGVyYXRlZCBlbGVtZW50J3MgaW50ZWdlciBwb3NpdGlvbiBpbiB0aGUgZG9tIGxpc3RcbiAgICAgIGN1cnJlbnRNb2RlbCA9IGZ1bmN0aW9uKGVsZW1lbnQsIGluZGV4LCBhcnJheSwgY2lkKXtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuY2lkID09PSBjaWQ7IC8vIFJldHVybnMgdHJ1ZSBpZiBjdXJyZW50bHkgb2JzZXJ2ZWQgZWxlbWVudCBpcyB0aGUgY3VycmVudCBtb2RlbC5cbiAgICAgIH07XG5cbiAgaWYoKCFfLmlzQXJyYXkodmFsdWUpIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCkgJiYgb3B0aW9ucy5pbnZlcnNlKXtkZWJ1Z2dlcjtcbiAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudiwgb3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCk7XG4gIH1cblxuICAvLyBGb3IgZWFjaCBpdGVtIGluIHRoaXMgY29sbGVjdGlvblxuICBmb3IoaT0wO2kgPCB2YWx1ZS5sZW5ndGg7aSsrKXtcbiAgICBvYmogPSB2YWx1ZVtpXTtcbiAgICBuZXh0ID0gKG1vcnBoKSA/IG1vcnBoLm5leHRNb3JwaCA6IG51bGw7XG5cbiAgICAvLyBJZiB0aGlzIG1vcnBoIGlzIHRoZSByZW5kZXJlZCB2ZXJzaW9uIG9mIHRoaXMgbW9kZWwsIGNvbnRpbnVlIHRvIHRoZSBuZXh0IG9uZS5cbiAgICBpZihtb3JwaCAmJiBtb3JwaC5jaWQgPT0gb2JqLmNpZCl7IG1vcnBoID0gbmV4dDsgY29udGludWU7IH1cblxuICAgIG5tb3JwaCA9IG9wdGlvbnMubW9ycGguaW5zZXJ0Q29udGVudEJlZm9yZU1vcnBoKCcnLCBtb3JwaCk7XG5cbiAgICAvLyBDcmVhdGUgYSBsYXp5dmFsdWUgd2hvcyB2YWx1ZSBpcyB0aGUgY29udGVudCBpbnNpZGUgb3VyIGJsb2NrIGhlbHBlciByZW5kZXJlZCBpbiB0aGUgY29udGV4dCBvZiB0aGlzIGN1cnJlbnQgbGlzdCBvYmplY3QuIFJldHVybnMgdGhlIHJlbmRlcmVkIGRvbSBmb3IgdGhpcyBsaXN0IGl0ZW0uXG4gICAgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52LCBvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50LCBbb2JqXSk7XG4gICAgfSwge21vcnBoOiBvcHRpb25zLm1vcnBofSk7XG5cbiAgICAvLyBJbnNlcnQgb3VyIG5ld2x5IHJlbmRlcmVkIHZhbHVlIChhIGRvY3VtZW50IHRyZWUpIGludG8gb3VyIHBsYWNlaG9sZGVyICh0aGUgY29udGFpbmluZyBlbGVtZW50KSBhdCBpdHMgcmVxdWVzdGVkIHBvc2l0aW9uICh3aGVyZSB3ZSBjdXJyZW50bHkgYXJlIGluIHRoZSBvYmplY3QgbGlzdClcbiAgICBubW9ycGguc2V0Q29udGVudChsYXp5VmFsdWUudmFsdWUoKSk7XG5cbiAgICAvLyBMYWJlbCB0aGUgaW5zZXJ0ZWQgbW9ycGggZWxlbWVudCB3aXRoIHRoaXMgbW9kZWwncyBjaWRcbiAgICBubW9ycGguY2lkID0gb2JqLmNpZDtcblxuICAgIC8vIERlc3Ryb3kgdGhlIG9sZCBtb3JwaCB0aGF0IHdhcyBoZXJlXG4gICAgbW9ycGggJiYgbW9ycGguZGVzdHJveSgpO1xuXG4gICAgLy8gTW92ZSBvbiB0byB0aGUgbmV4dCBtb3JwaFxuICAgIG1vcnBoID0gbmV4dDtcbiAgfVxuXG4gIC8vIElmIGFueSBtb3JlIG1vcnBocyBhcmUgbGVmdCBvdmVyLCByZW1vdmUgdGhlbS4gV2UndmUgYWxyZWFkeSBnb25lIHRocm91Z2ggYWxsIHRoZSBtb2RlbHMuXG4gIHdoaWxlKG1vcnBoKXtcbiAgICBuZXh0ID0gbW9ycGgubmV4dE1vcnBoO1xuICAgIG1vcnBoLmRlc3Ryb3koKTtcbiAgICBtb3JwaCA9IG5leHQ7XG4gIH1cblxuICAvLyBSZXR1cm4gbnVsbCBwcmV2ZW50J3MgcmUtcmVuZGluZyBvZiBvdXIgcGxhY2Vob2xkZXIuIE91ciBwbGFjZWhvbGRlciAoY29udGFpbmluZyBlbGVtZW50KSBub3cgaGFzIGFsbCB0aGUgZG9tIHdlIG5lZWQuXG4gIHJldHVybiBudWxsO1xuXG59O1xuXG5oZWxwZXJzLnBhcnRpYWwgPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIHZhciBwYXJ0aWFsID0gcGFydGlhbHNbcGFyYW1zWzBdXTtcbiAgaWYoIHBhcnRpYWwgJiYgcGFydGlhbC5pc0hUTUxCYXJzICl7XG4gICAgcmV0dXJuIHBhcnRpYWwucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52KTtcbiAgfVxuXG59O1xuXG5leHBvcnQgZGVmYXVsdCBoZWxwZXJzO1xuIiwiLy8gUmVib3VuZCBDb21wdXRlZCBQcm9wZXJ0eVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgcHJvcGVydHlDb21waWxlciBmcm9tIFwicHJvcGVydHktY29tcGlsZXIvcHJvcGVydHktY29tcGlsZXJcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG4vLyBSZXR1cm5zIHRydWUgaWYgc3RyIHN0YXJ0cyB3aXRoIHRlc3RcbmZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyLCB0ZXN0KXtcbiAgaWYoc3RyID09PSB0ZXN0KSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIHN0ci5zdWJzdHJpbmcoMCwgdGVzdC5sZW5ndGgrMSkgPT09IHRlc3QrJy4nO1xufVxuXG5cbi8vIENhbGxlZCBhZnRlciBjYWxsc3RhY2sgaXMgZXhhdXN0ZWQgdG8gY2FsbCBhbGwgb2YgdGhpcyBjb21wdXRlZCBwcm9wZXJ0eSdzXG4vLyBkZXBlbmRhbnRzIHRoYXQgbmVlZCB0byBiZSByZWNvbXB1dGVkXG5mdW5jdGlvbiByZWNvbXB1dGVDYWxsYmFjaygpe1xuICB2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3RvQ2FsbC5sZW5ndGg7XG4gIGRlbGV0ZSB0aGlzLl9yZWNvbXB1dGVUaW1lb3V0O1xuICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgdGhpcy5fdG9DYWxsLnNoaWZ0KCkuY2FsbCgpO1xuICB9XG4gIHRoaXMuX3RvQ2FsbC5hZGRlZCA9IHt9O1xufVxuXG52YXIgQ29tcHV0ZWRQcm9wZXJ0eSA9IGZ1bmN0aW9uKHByb3AsIG9wdGlvbnMpe1xuXG4gIGlmKCFfLmlzRnVuY3Rpb24ocHJvcCkpIHJldHVybiBjb25zb2xlLmVycm9yKCdDb21wdXRlZFByb3BlcnR5IGNvbnN0cnVjdG9yIG11c3QgYmUgcGFzc2VkIGEgZnVuY3Rpb24hJywgcHJvcCwgJ0ZvdW5kIGluc3RlYWQuJyk7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ2NvbXB1dGVkUHJvcGV0eScpO1xuICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG4gIHRoaXMucmV0dXJuVHlwZSA9IG51bGw7XG4gIHRoaXMuX19vYnNlcnZlcnMgPSB7fTtcbiAgdGhpcy5oZWxwZXJzID0ge307XG4gIHRoaXMud2FpdGluZyA9IHt9O1xuICB0aGlzLmlzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgdGhpcy5pc0RpcnR5ID0gdHJ1ZTtcbiAgdGhpcy5mdW5jID0gcHJvcDtcbiAgXy5iaW5kQWxsKHRoaXMsICdvbk1vZGlmeScsICdtYXJrRGlydHknKTtcbiAgdGhpcy5kZXBzID0gcHJvcGVydHlDb21waWxlci5jb21waWxlKHByb3AsIHRoaXMubmFtZSk7XG5cbiAgLy8gQ3JlYXRlIGxpbmVhZ2UgdG8gcGFzcyB0byBvdXIgY2FjaGUgb2JqZWN0c1xuICB2YXIgbGluZWFnZSA9IHtcbiAgICBwYXJlbnQ6IHRoaXMuc2V0UGFyZW50KCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICksXG4gICAgcm9vdDogdGhpcy5zZXRSb290KCBvcHRpb25zLnJvb3QgfHwgb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApLFxuICAgIHBhdGg6IHRoaXMuX19wYXRoID0gb3B0aW9ucy5wYXRoIHx8IHRoaXMuX19wYXRoXG4gIH07XG5cbiAgLy8gUmVzdWx0cyBDYWNoZSBPYmplY3RzXG4gIC8vIFRoZXNlIG1vZGVscyB3aWxsIG5ldmVyIGJlIHJlLWNyZWF0ZWQgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgQ29tcHV0ZWQgUHJvZXBydHlcbiAgLy8gT24gUmVjb21wdXRlIHRoZXkgYXJlIHVwZGF0ZWQgd2l0aCBuZXcgdmFsdWVzLlxuICAvLyBPbiBDaGFuZ2UgdGhlaXIgbmV3IHZhbHVlcyBhcmUgcHVzaGVkIHRvIHRoZSBvYmplY3QgaXQgaXMgdHJhY2tpbmdcbiAgdGhpcy5jYWNoZSA9IHtcbiAgICBtb2RlbDogbmV3IFJlYm91bmQuTW9kZWwoe30sIGxpbmVhZ2UpLFxuICAgIGNvbGxlY3Rpb246IG5ldyBSZWJvdW5kLkNvbGxlY3Rpb24oW10sIGxpbmVhZ2UpLFxuICAgIHZhbHVlOiB1bmRlZmluZWRcbiAgfTtcblxuICB0aGlzLndpcmUoKTtcblxufTtcblxuXy5leHRlbmQoQ29tcHV0ZWRQcm9wZXJ0eS5wcm90b3R5cGUsIEJhY2tib25lLkV2ZW50cywge1xuXG4gIGlzQ29tcHV0ZWRQcm9wZXJ0eTogdHJ1ZSxcbiAgaXNEYXRhOiB0cnVlLFxuICBfX3BhdGg6IGZ1bmN0aW9uKCl7IHJldHVybiAnJzsgfSxcblxuXG4gIG1hcmtEaXJ0eTogZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLmlzRGlydHkpIHJldHVybjtcbiAgICB0aGlzLmlzRGlydHkgPSB0cnVlO1xuICAgIHRoaXMudHJpZ2dlcignZGlydHknLCB0aGlzKTtcbiAgfSxcblxuICAvLyBBdHRhY2hlZCB0byBsaXN0ZW4gdG8gYWxsIGV2ZW50cyB3aGVyZSB0aGlzIENvbXB1dGVkIFByb3BlcnR5J3MgZGVwZW5kYW5jaWVzXG4gIC8vIGFyZSBzdG9yZWQuIFNlZSB3aXJlKCkuIFdpbGwgcmUtZXZhbHVhdGUgYW55IGNvbXB1dGVkIHByb3BlcnRpZXMgdGhhdFxuICAvLyBkZXBlbmQgb24gdGhlIGNoYW5nZWQgZGF0YSB2YWx1ZSB3aGljaCB0cmlnZ2VyZWQgdGhpcyBjYWxsYmFjay5cbiAgb25SZWNvbXB1dGU6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICB2YXIgc2hvcnRjaXJjdWl0ID0geyBjaGFuZ2U6IDEsIHNvcnQ6IDEsIHJlcXVlc3Q6IDEsIGRlc3Ryb3k6IDEsIHN5bmM6IDEsIGVycm9yOiAxLCBpbnZhbGlkOiAxLCByb3V0ZTogMSwgZGlydHk6IDEgfTtcbiAgICBpZiggc2hvcnRjaXJjdWl0W3R5cGVdIHx8ICFtb2RlbC5pc0RhdGEgKSByZXR1cm47XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB0aGlzLl90b0NhbGwgfHwgKHRoaXMuX3RvQ2FsbCA9IFtdKTtcbiAgICB0aGlzLl90b0NhbGwuYWRkZWQgfHwgKHRoaXMuX3RvQ2FsbC5hZGRlZCA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgKG9wdGlvbnMgPSBjb2xsZWN0aW9uKSAmJiAoY29sbGVjdGlvbiA9IG1vZGVsKTtcbiAgICB2YXIgcHVzaCA9IGZ1bmN0aW9uKGFycil7XG4gICAgICB2YXIgaSwgbGVuID0gYXJyLmxlbmd0aDtcbiAgICAgIHRoaXMuYWRkZWQgfHwgKHRoaXMuYWRkZWQgPSB7fSk7XG4gICAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICAgIGlmKHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0pIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLmFkZGVkW2FycltpXS5jaWRdID0gMTtcbiAgICAgICAgdGhpcy5wdXNoKGFycltpXSk7XG4gICAgICB9XG4gICAgfSwgcGF0aCwgdmVjdG9yO1xuICAgIHZlY3RvciA9IHBhdGggPSBjb2xsZWN0aW9uLl9fcGF0aCgpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuXG4gICAgLy8gSWYgYSByZXNldCBldmVudCBvbiBhIE1vZGVsLCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZFxuICAgIC8vIG9uIGVhY2ggY2hhbmdlZCBhdHRyaWJ1dGUncyBmdWxsIHBhdGguXG4gICAgaWYodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzQXR0cmlidXRlcyl7XG4gICAgICBfLmVhY2gob3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgICB2ZWN0b3IgPSBwYXRoICsgKHBhdGggJiYgJy4nKSArIGtleTtcbiAgICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICAgIHN0YXJ0c1dpdGgodmVjdG9yLCBkZXBlbmRhbmN5KSAmJiBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIHJlc2V0IGV2ZW50IG9uIGEgQ29sbGN0aW9uLCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZFxuICAgIC8vIG9uIGFueXRoaW5nIGluc2lkZSB0aGF0IGNvbGxlY3Rpb24uXG4gICAgZWxzZSBpZih0eXBlID09PSAncmVzZXQnICYmIG9wdGlvbnMucHJldmlvdXNNb2RlbHMpe1xuICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICBzdGFydHNXaXRoKGRlcGVuZGFuY3ksIHZlY3RvcikgJiYgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhbiBhZGQgb3IgcmVtb3ZlIGV2ZW50LCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZCBvblxuICAgIC8vIGFueXRoaW5nIGluc2lkZSB0aGF0IGNvbGxlY3Rpb24gb3IgdGhhdCBjb250YWlucyB0aGF0IGNvbGxlY3Rpb24uXG4gICAgZWxzZSBpZih0eXBlID09PSAnYWRkJyB8fCB0eXBlID09PSAncmVtb3ZlJyl7XG4gICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgIGlmKCBzdGFydHNXaXRoKGRlcGVuZGFuY3ksIHZlY3RvcikgfHwgc3RhcnRzV2l0aCh2ZWN0b3IsIGRlcGVuZGFuY3kpICkgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7O1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLy8gSWYgYSBjaGFuZ2UgZXZlbnQsIHRyaWdnZXIgYW55dGhpbmcgdGhhdCBkZXBlbmRzIG9uIHRoYXQgY2hhbmdlZCBwYXRoLlxuICAgIGVsc2UgaWYodHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgPT09IDApe1xuICAgICAgdmVjdG9yID0gdHlwZS5yZXBsYWNlKCdjaGFuZ2U6JywgJycpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICBzdGFydHNXaXRoKHZlY3RvciwgZGVwZW5kYW5jeSkgJiYgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICB2YXIgaSwgbGVuID0gdGhpcy5fdG9DYWxsLmxlbmd0aDtcbiAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICB0aGlzLl90b0NhbGxbaV0ubWFya0RpcnR5KCk7XG4gICAgfVxuXG4gICAgLy8gTm90aWZpZXMgYWxsIGNvbXB1dGVkIHByb3BlcnRpZXMgaW4gdGhlIGRlcGVuZGFudHMgYXJyYXkgdG8gcmVjb21wdXRlLlxuICAgIC8vIE1hcmtzIGV2ZXJ5b25lIGFzIGRpcnR5IGFuZCB0aGVuIGNhbGxzIHRoZW0uXG4gICAgaWYoIXRoaXMuX3JlY29tcHV0ZVRpbWVvdXQpIHRoaXMuX3JlY29tcHV0ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KF8uYmluZChyZWNvbXB1dGVDYWxsYmFjaywgdGhpcyksIDApO1xuICAgIHJldHVybjtcbiAgfSxcblxuXG4gIC8vIENhbGxlZCB3aGVuIGEgQ29tcHV0ZWQgUHJvcGVydHkncyBhY3RpdmUgY2FjaGUgb2JqZWN0IGNoYW5nZXMuXG4gIC8vIFB1c2hlcyBhbnkgY2hhbmdlcyB0byBDb21wdXRlZCBQcm9wZXJ0eSB0aGF0IHJldHVybnMgYSBkYXRhIG9iamVjdCBiYWNrIHRvXG4gIC8vIHRoZSBvcmlnaW5hbCBvYmplY3QuXG4gIG9uTW9kaWZ5OiBmdW5jdGlvbih0eXBlLCBtb2RlbCwgY29sbGVjdGlvbiwgb3B0aW9ucyl7XG4gICAgdmFyIHNob3J0Y2lyY3VpdCA9IHsgc29ydDogMSwgcmVxdWVzdDogMSwgZGVzdHJveTogMSwgc3luYzogMSwgZXJyb3I6IDEsIGludmFsaWQ6IDEsIHJvdXRlOiAxIH07XG4gICAgaWYoICF0aGlzLnRyYWNraW5nIHx8IHNob3J0Y2lyY3VpdFt0eXBlXSB8fCB+dHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgKSByZXR1cm47XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgXy5pc09iamVjdChjb2xsZWN0aW9uKSAmJiAob3B0aW9ucyA9IGNvbGxlY3Rpb24pICYmIChjb2xsZWN0aW9uID0gbW9kZWwpO1xuICAgIHZhciBzcmMgPSB0aGlzO1xuICAgIHZhciBwYXRoID0gY29sbGVjdGlvbi5fX3BhdGgoKS5yZXBsYWNlKHNyYy5fX3BhdGgoKSwgJycpLnJlcGxhY2UoL15cXC4vLCAnJyk7XG4gICAgdmFyIGRlc3QgPSB0aGlzLnRyYWNraW5nLmdldChwYXRoKTtcblxuICAgIGlmKF8uaXNVbmRlZmluZWQoZGVzdCkpIHJldHVybjtcbiAgICBpZih0eXBlID09PSAnY2hhbmdlJykgZGVzdC5zZXQgJiYgZGVzdC5zZXQobW9kZWwuY2hhbmdlZEF0dHJpYnV0ZXMoKSk7XG4gICAgZWxzZSBpZih0eXBlID09PSAncmVzZXQnKSBkZXN0LnJlc2V0ICYmIGRlc3QucmVzZXQobW9kZWwpO1xuICAgIGVsc2UgaWYodHlwZSA9PT0gJ2FkZCcpICBkZXN0LmFkZCAmJiBkZXN0LmFkZChtb2RlbCk7XG4gICAgZWxzZSBpZih0eXBlID09PSAncmVtb3ZlJykgIGRlc3QucmVtb3ZlICYmIGRlc3QucmVtb3ZlKG1vZGVsKTtcbiAgICAvLyBUT0RPOiBBZGQgc29ydFxuICB9LFxuXG4gIC8vIEFkZHMgYSBsaXRlbmVyIHRvIHRoZSByb290IG9iamVjdCBhbmQgdGVsbHMgaXQgd2hhdCBwcm9wZXJ0aWVzIHRoaXNcbiAgLy8gQ29tcHV0ZWQgUHJvcGVydHkgZGVwZW5kIG9uLlxuICAvLyBUaGUgbGlzdGVuZXIgd2lsbCByZS1jb21wdXRlIHRoaXMgQ29tcHV0ZWQgUHJvcGVydHkgd2hlbiBhbnkgYXJlIGNoYW5nZWQuXG4gIHdpcmU6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHJvb3QgPSB0aGlzLl9fcm9vdF9fO1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5fX3BhcmVudF9fO1xuICAgIHJvb3QuX19jb21wdXRlZERlcHMgfHwgKHJvb3QuX19jb21wdXRlZERlcHMgPSB7fSk7XG5cbiAgICBfLmVhY2godGhpcy5kZXBzLCBmdW5jdGlvbihwYXRoKXtcbiAgICAgIHZhciBkZXAgPSByb290LmdldChwYXRoLCB7cmF3OiB0cnVlfSk7XG4gICAgICBpZighZGVwIHx8ICFkZXAuaXNDb21wdXRlZFByb3BlcnR5KSByZXR1cm47XG4gICAgICBkZXAub24oJ2RpcnR5JywgdGhpcy5tYXJrRGlydHkpO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgXy5lYWNoKHRoaXMuZGVwcywgZnVuY3Rpb24ocGF0aCl7XG4gICAgICAvLyBGaW5kIGFjdHVhbCBwYXRoIGZyb20gcmVsYXRpdmUgcGF0aHNcbiAgICAgIHZhciBzcGxpdCA9ICQuc3BsaXRQYXRoKHBhdGgpO1xuICAgICAgd2hpbGUoc3BsaXRbMF0gPT09ICdAcGFyZW50Jyl7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0Ll9fcGFyZW50X187XG4gICAgICAgIHNwbGl0LnNoaWZ0KCk7XG4gICAgICB9XG5cbiAgICAgIHBhdGggPSBjb250ZXh0Ll9fcGF0aCgpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuICAgICAgcGF0aCA9IHBhdGggKyAocGF0aCAmJiAnLicpICsgc3BsaXQuam9pbignLicpO1xuXG4gICAgICAvLyBBZGQgb3Vyc2VsdmVzIGFzIGRlcGVuZGFudHNcbiAgICAgIHJvb3QuX19jb21wdXRlZERlcHNbcGF0aF0gfHwgKHJvb3QuX19jb21wdXRlZERlcHNbcGF0aF0gPSBbXSk7XG4gICAgICByb290Ll9fY29tcHV0ZWREZXBzW3BhdGhdLnB1c2godGhpcyk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICAvLyBFbnN1cmUgd2Ugb25seSBoYXZlIG9uZSBsaXN0ZW5lciBwZXIgTW9kZWwgYXQgYSB0aW1lLlxuICAgIGNvbnRleHQub2ZmKCdhbGwnLCB0aGlzLm9uUmVjb21wdXRlKS5vbignYWxsJywgdGhpcy5vblJlY29tcHV0ZSk7XG4gIH0sXG5cbiAgLy8gQ2FsbCB0aGlzIGNvbXB1dGVkIHByb3BlcnR5IGxpa2UgeW91IHdvdWxkIHdpdGggRnVuY3Rpb24uY2FsbCgpXG4gIGNhbGw6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICBjb250ZXh0ID0gYXJncy5zaGlmdCgpO1xuICAgIHJldHVybiB0aGlzLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICB9LFxuXG4gIC8vIENhbGwgdGhpcyBjb21wdXRlZCBwcm9wZXJ0eSBsaWtlIHlvdSB3b3VsZCB3aXRoIEZ1bmN0aW9uLmFwcGx5KClcbiAgLy8gT25seSBwcm9wZXJ0aWVzIHRoYXQgYXJlIG1hcmtlZCBhcyBkaXJ0eSBhbmQgYXJlIG5vdCBhbHJlYWR5IGNvbXB1dGluZ1xuICAvLyB0aGVtc2VsdmVzIGFyZSBldmFsdWF0ZWQgdG8gcHJldmVudCBjeWNsaWMgY2FsbGJhY2tzLiBJZiBhbnkgZGVwZW5kYW50c1xuICAvLyBhcmVuJ3QgZmluaXNoZWQgY29tcHV0ZWRpbmcsIHdlIGFkZCBvdXJzZWx2ZWQgdG8gdGhlaXIgd2FpdGluZyBsaXN0LlxuICAvLyBWYW5pbGxhIG9iamVjdHMgcmV0dXJuZWQgZnJvbSB0aGUgZnVuY3Rpb24gYXJlIHByb21vdGVkIHRvIFJlYm91bmQgT2JqZWN0cy5cbiAgLy8gVGhlbiwgc2V0IHRoZSBwcm9wZXIgcmV0dXJuIHR5cGUgZm9yIGZ1dHVyZSBmZXRjaGVzIGZyb20gdGhlIGNhY2hlIGFuZCBzZXRcbiAgLy8gdGhlIG5ldyBjb21wdXRlZCB2YWx1ZS4gVHJhY2sgY2hhbmdlcyB0byB0aGUgY2FjaGUgdG8gcHVzaCBpdCBiYWNrIHVwIHRvXG4gIC8vIHRoZSBvcmlnaW5hbCBvYmplY3QgYW5kIHJldHVybiB0aGUgdmFsdWUuXG4gIGFwcGx5OiBmdW5jdGlvbihjb250ZXh0LCBwYXJhbXMpe1xuXG4gICAgaWYoIXRoaXMuaXNEaXJ0eSB8fCB0aGlzLmlzQ2hhbmdpbmcpIHJldHVybjtcbiAgICB0aGlzLmlzQ2hhbmdpbmcgPSB0cnVlO1xuXG4gICAgdmFyIHZhbHVlID0gdGhpcy5jYWNoZVt0aGlzLnJldHVyblR5cGVdLFxuICAgICAgICByZXN1bHQ7XG5cbiAgICBjb250ZXh0IHx8IChjb250ZXh0ID0gdGhpcy5fX3BhcmVudF9fKTtcblxuICAgIC8vIENoZWNrIGFsbCBvZiBvdXIgZGVwZW5kYW5jaWVzIHRvIHNlZSBpZiB0aGV5IGFyZSBldmFsdWF0aW5nLlxuICAgIC8vIElmIHdlIGhhdmUgYSBkZXBlbmRhbmN5IHRoYXQgaXMgZGlydHkgYW5kIHRoaXMgaXNudCBpdHMgZmlyc3QgcnVuLFxuICAgIC8vIExldCB0aGlzIGRlcGVuZGFuY3kga25vdyB0aGF0IHdlIGFyZSB3YWl0aW5nIGZvciBpdC5cbiAgICAvLyBJdCB3aWxsIHJlLXJ1biB0aGlzIENvbXB1dGVkIFByb3BlcnR5IGFmdGVyIGl0IGZpbmlzaGVzLlxuICAgIF8uZWFjaCh0aGlzLmRlcHMsIGZ1bmN0aW9uKGRlcCl7XG4gICAgICB2YXIgZGVwZW5kYW5jeSA9IGNvbnRleHQuZ2V0KGRlcCwge3JhdzogdHJ1ZX0pO1xuICAgICAgaWYoIWRlcGVuZGFuY3kgfHwgIWRlcGVuZGFuY3kuaXNDb21wdXRlZFByb3BlcnR5KSByZXR1cm47XG4gICAgICBpZihkZXBlbmRhbmN5LmlzRGlydHkgJiYgZGVwZW5kYW5jeS5yZXR1cm5UeXBlICE9PSBudWxsKXtcbiAgICAgICAgZGVwZW5kYW5jeS53YWl0aW5nW3RoaXMuY2lkXSA9IHRoaXM7XG4gICAgICAgIGRlcGVuZGFuY3kuYXBwbHkoKTsgLy8gVHJ5IHRvIHJlLWV2YWx1YXRlIHRoaXMgZGVwZW5kYW5jeSBpZiBpdCBpcyBkaXJ0eVxuICAgICAgICBpZihkZXBlbmRhbmN5LmlzRGlydHkpIHJldHVybiB0aGlzLmlzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSBkZXBlbmRhbmN5LndhaXRpbmdbdGhpcy5jaWRdO1xuICAgICAgLy8gVE9ETzogVGhlcmUgY2FuIGJlIGEgY2hlY2sgaGVyZSBsb29raW5nIGZvciBjeWNsaWMgZGVwZW5kYW5jaWVzLlxuICAgIH0sIHRoaXMpO1xuXG4gICAgaWYoIXRoaXMuaXNDaGFuZ2luZykgcmV0dXJuO1xuXG4gICAgdGhpcy5zdG9wTGlzdGVuaW5nKHZhbHVlLCAnYWxsJywgdGhpcy5vbk1vZGlmeSk7XG5cbiAgICByZXN1bHQgPSB0aGlzLmZ1bmMuYXBwbHkoY29udGV4dCwgcGFyYW1zKTtcblxuICAgIC8vIFByb21vdGUgdmFuaWxsYSBvYmplY3RzIHRvIFJlYm91bmQgRGF0YSBrZWVwaW5nIHRoZSBzYW1lIG9yaWdpbmFsIG9iamVjdHNcbiAgICBpZihfLmlzQXJyYXkocmVzdWx0KSkgcmVzdWx0ID0gbmV3IFJlYm91bmQuQ29sbGVjdGlvbihyZXN1bHQsIHtjbG9uZTogZmFsc2V9KTtcbiAgICBlbHNlIGlmKF8uaXNPYmplY3QocmVzdWx0KSAmJiAhcmVzdWx0LmlzRGF0YSkgcmVzdWx0ID0gbmV3IFJlYm91bmQuTW9kZWwocmVzdWx0LCB7Y2xvbmU6IGZhbHNlfSk7XG5cbiAgICAvLyBJZiByZXN1bHQgaXMgdW5kZWZpbmVkLCByZXNldCBvdXIgY2FjaGUgaXRlbVxuICAgIGlmKF8uaXNVbmRlZmluZWQocmVzdWx0KSB8fCBfLmlzTnVsbChyZXN1bHQpKXtcbiAgICAgIHRoaXMucmV0dXJuVHlwZSA9ICd2YWx1ZSc7XG4gICAgICB0aGlzLmlzQ29sbGVjdGlvbiA9IHRoaXMuaXNNb2RlbCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXQodW5kZWZpbmVkKTtcbiAgICB9XG4gICAgLy8gU2V0IHJlc3VsdCBhbmQgcmV0dXJuIHR5cGVzLCBiaW5kIGV2ZW50c1xuICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbil7XG4gICAgICB0aGlzLnJldHVyblR5cGUgPSAnY29sbGVjdGlvbic7XG4gICAgICB0aGlzLmlzQ29sbGVjdGlvbiA9IHRydWU7XG4gICAgICB0aGlzLmlzTW9kZWwgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2V0KHJlc3VsdCk7XG4gICAgICB0aGlzLnRyYWNrKHJlc3VsdCk7XG4gICAgfVxuICAgIGVsc2UgaWYocmVzdWx0LmlzTW9kZWwpe1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ21vZGVsJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gZmFsc2U7XG4gICAgICB0aGlzLmlzTW9kZWwgPSB0cnVlO1xuICAgICAgdGhpcy5yZXNldChyZXN1bHQpO1xuICAgICAgdGhpcy50cmFjayhyZXN1bHQpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ3ZhbHVlJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gdGhpcy5pc01vZGVsID0gZmFsc2U7XG4gICAgICB0aGlzLnJlc2V0KHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudmFsdWUoKTtcbiAgfSxcblxuICAvLyBXaGVuIHdlIHJlY2VpdmUgYSBuZXcgbW9kZWwgdG8gc2V0IGluIG91ciBjYWNoZSwgdW5iaW5kIHRoZSB0cmFja2VyIGZyb21cbiAgLy8gdGhlIHByZXZpb3VzIGNhY2hlIG9iamVjdCwgc3luYyB0aGUgb2JqZWN0cycgY2lkcyBzbyBoZWxwZXJzIHRoaW5rIHRoZXlcbiAgLy8gYXJlIHRoZSBzYW1lIG9iamVjdCwgc2F2ZSBhIHJlZmVyYW5jZSB0byB0aGUgb2JqZWN0IHdlIGFyZSB0cmFja2luZyxcbiAgLy8gYW5kIHJlLWJpbmQgb3VyIG9uTW9kaWZ5IGhvb2suXG4gIHRyYWNrOiBmdW5jdGlvbihvYmplY3Qpe1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLnZhbHVlKCk7XG4gICAgaWYoIW9iamVjdCB8fCAhdGFyZ2V0IHx8ICF0YXJnZXQuaXNEYXRhIHx8ICFvYmplY3QuaXNEYXRhKSByZXR1cm47XG4gICAgdGFyZ2V0Ll9jaWQgfHwgKHRhcmdldC5fY2lkID0gdGFyZ2V0LmNpZCk7XG4gICAgb2JqZWN0Ll9jaWQgfHwgKG9iamVjdC5fY2lkID0gb2JqZWN0LmNpZCk7XG4gICAgdGFyZ2V0LmNpZCA9IG9iamVjdC5jaWQ7XG4gICAgdGhpcy50cmFja2luZyA9IG9iamVjdDtcbiAgICB0aGlzLmxpc3RlblRvKHRhcmdldCwgJ2FsbCcsIHRoaXMub25Nb2RpZnkpO1xuICB9LFxuXG4gIC8vIEdldCBmcm9tIHRoZSBDb21wdXRlZCBQcm9wZXJ0eSdzIGNhY2hlXG4gIGdldDogZnVuY3Rpb24oa2V5LCBvcHRpb25zKXtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlKCk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICd2YWx1ZScpIHJldHVybiBjb25zb2xlLmVycm9yKCdDYWxsZWQgZ2V0IG9uIHRoZSBgJysgdGhpcy5uYW1lICsnYCBjb21wdXRlZCBwcm9wZXJ0eSB3aGljaCByZXR1cm5zIGEgcHJpbWl0aXZlIHZhbHVlLicpO1xuICAgIHJldHVybiB2YWx1ZS5nZXQoa2V5LCBvcHRpb25zKTtcbiAgfSxcblxuICAvLyBTZXQgdGhlIENvbXB1dGVkIFByb3BlcnR5J3MgY2FjaGUgdG8gYSBuZXcgdmFsdWUgYW5kIHRyaWdnZXIgYXBwcm9wcmVhdGUgZXZlbnRzLlxuICAvLyBDaGFuZ2VzIHdpbGwgcHJvcGFnYXRlIGJhY2sgdG8gdGhlIG9yaWdpbmFsIG9iamVjdCBpZiBhIFJlYm91bmQgRGF0YSBPYmplY3QgYW5kIHJlLWNvbXB1dGUuXG4gIC8vIElmIENvbXB1dGVkIFByb3BlcnR5IHJldHVybnMgYSB2YWx1ZSwgYWxsIGRvd25zdHJlYW0gZGVwZW5kYW5jaWVzIHdpbGwgcmUtY29tcHV0ZS5cbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucyl7XG4gICAgaWYodGhpcy5yZXR1cm5UeXBlID09PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdmFyIGF0dHJzID0ga2V5O1xuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICdtb2RlbCcpe1xuICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGF0dHJzID0gKGtleS5pc01vZGVsKSA/IGtleS5hdHRyaWJ1dGVzIDoga2V5O1xuICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuICAgIGlmKHRoaXMucmV0dXJuVHlwZSAhPT0gJ21vZGVsJykgb3B0aW9ucyA9IHZhbCB8fCB7fTtcbiAgICBhdHRycyA9IChhdHRycyAmJiBhdHRycy5pc0NvbXB1dGVkUHJvcGVydHkpID8gYXR0cnMudmFsdWUoKSA6IGF0dHJzO1xuXG4gICAgLy8gSWYgYSBuZXcgdmFsdWUsIHNldCBpdCBhbmQgdHJpZ2dlciBldmVudHNcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICd2YWx1ZScgJiYgdGhpcy5jYWNoZS52YWx1ZSAhPT0gYXR0cnMpe1xuICAgICAgdGhpcy5jYWNoZS52YWx1ZSA9IGF0dHJzO1xuICAgICAgaWYoIW9wdGlvbnMucXVpZXQpe1xuICAgICAgICAvLyBJZiBzZXQgd2FzIGNhbGxlZCBub3QgdGhyb3VnaCBjb21wdXRlZFByb3BlcnR5LmNhbGwoKSwgdGhpcyBpcyBhIGZyZXNoIG5ldyBldmVudCBidXJzdC5cbiAgICAgICAgaWYoIXRoaXMuaXNEaXJ0eSAmJiAhdGhpcy5pc0NoYW5naW5nKSB0aGlzLl9fcGFyZW50X18uY2hhbmdlZCA9IHt9O1xuICAgICAgICB0aGlzLl9fcGFyZW50X18uY2hhbmdlZFt0aGlzLm5hbWVdID0gYXR0cnM7XG4gICAgICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJywgdGhpcy5fX3BhcmVudF9fKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2U6Jyt0aGlzLm5hbWUsIHRoaXMuX19wYXJlbnRfXywgYXR0cnMpO1xuICAgICAgICBkZWxldGUgdGhpcy5fX3BhcmVudF9fLmNoYW5nZWRbdGhpcy5uYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZih0aGlzLnJldHVyblR5cGUgIT09ICd2YWx1ZScgJiYgb3B0aW9ucy5yZXNldCkga2V5ID0gdmFsdWUucmVzZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIGVsc2UgaWYodGhpcy5yZXR1cm5UeXBlICE9PSAndmFsdWUnKSBrZXkgPSB2YWx1ZS5zZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIHRoaXMuaXNEaXJ0eSA9IHRoaXMuaXNDaGFuZ2luZyA9IGZhbHNlO1xuXG4gICAgLy8gQ2FsbCBhbGwgcmVhbWluaW5nIGNvbXB1dGVkIHByb3BlcnRpZXMgd2FpdGluZyBmb3IgdGhpcyB2YWx1ZSB0byByZXNvbHZlLlxuICAgIF8uZWFjaCh0aGlzLndhaXRpbmcsIGZ1bmN0aW9uKHByb3ApeyBwcm9wICYmIHByb3AuY2FsbCgpOyB9KTtcblxuICAgIHJldHVybiBrZXk7XG4gIH0sXG5cbiAgLy8gUmV0dXJuIHRoZSBjdXJyZW50IHZhbHVlIGZyb20gdGhlIGNhY2hlLCBydW5uaW5nIGlmIGRpcnR5LlxuICB2YWx1ZTogZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLmlzRGlydHkpIHRoaXMuYXBwbHkoKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZVt0aGlzLnJldHVyblR5cGVdO1xuICB9LFxuXG4gIC8vIFJlc2V0IHRoZSBjdXJyZW50IHZhbHVlIGluIHRoZSBjYWNoZSwgcnVubmluZyBpZiBmaXJzdCBydW4uXG4gIHJlc2V0OiBmdW5jdGlvbihvYmosIG9wdGlvbnMpe1xuICAgIGlmKF8uaXNOdWxsKHRoaXMucmV0dXJuVHlwZSkpIHJldHVybjsgLy8gRmlyc3QgcnVuXG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBvcHRpb25zLnJlc2V0ID0gdHJ1ZTtcbiAgICByZXR1cm4gIHRoaXMuc2V0KG9iaiwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgLy8gQ3ljbGljIGRlcGVuZGFuY3kgc2FmZSB0b0pTT04gbWV0aG9kLlxuICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc1NlcmlhbGl6aW5nKSByZXR1cm4gdGhpcy5jaWQ7XG4gICAgdmFyIHZhbCA9IHRoaXMudmFsdWUoKTtcbiAgICB0aGlzLl9pc1NlcmlhbGl6aW5nID0gdHJ1ZTtcbiAgICB2YXIganNvbiA9ICh2YWwgJiYgXy5pc0Z1bmN0aW9uKHZhbC50b0pTT04pKSA/IHZhbC50b0pTT04oKSA6IHZhbDtcbiAgICB0aGlzLl9pc1NlcmlhbGl6aW5nID0gZmFsc2U7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cblxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IENvbXB1dGVkUHJvcGVydHk7XG4iLCIvLyBSZWJvdW5kIEhvb2tzXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBMYXp5VmFsdWUgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2xhenktdmFsdWVcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuaW1wb3J0IGhlbHBlcnMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hlbHBlcnNcIjtcblxudmFyIGhvb2tzID0ge30sXG4gICAgYXR0cmlidXRlcyA9IHsgIGFiYnI6IDEsICAgICAgXCJhY2NlcHQtY2hhcnNldFwiOiAxLCAgIGFjY2VwdDogMSwgICAgICBhY2Nlc3NrZXk6IDEsICAgICBhY3Rpb246IDEsXG4gICAgICAgICAgICAgICAgICAgIGFsaWduOiAxLCAgICAgIGFsaW5rOiAxLCAgICAgICAgICAgICBhbHQ6IDEsICAgICAgICAgYXJjaGl2ZTogMSwgICAgICAgYXhpczogMSxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogMSwgYmdjb2xvcjogMSwgICAgICAgICAgIGJvcmRlcjogMSwgICAgICBjZWxscGFkZGluZzogMSwgICBjZWxsc3BhY2luZzogMSxcbiAgICAgICAgICAgICAgICAgICAgY2hhcjogMSwgICAgICAgY2hhcm9mZjogMSwgICAgICAgICAgIGNoYXJzZXQ6IDEsICAgICBjaGVja2VkOiAxLCAgICAgICBjaXRlOiAxLFxuICAgICAgICAgICAgICAgICAgICBjbGFzczogMSwgICAgICBjbGFzc2lkOiAxLCAgICAgICAgICAgY2xlYXI6IDEsICAgICAgIGNvZGU6IDEsICAgICAgICAgIGNvZGViYXNlOiAxLFxuICAgICAgICAgICAgICAgICAgICBjb2RldHlwZTogMSwgICBjb2xvcjogMSwgICAgICAgICAgICAgY29sczogMSwgICAgICAgIGNvbHNwYW46IDEsICAgICAgIGNvbXBhY3Q6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IDEsICAgIGNvb3JkczogMSwgICAgICAgICAgICBkYXRhOiAxLCAgICAgICAgZGF0ZXRpbWU6IDEsICAgICAgZGVjbGFyZTogMSxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXI6IDEsICAgICAgZGlyOiAxLCAgICAgICAgICAgICAgIGRpc2FibGVkOiAxLCAgICBlbmN0eXBlOiAxLCAgICAgICBmYWNlOiAxLFxuICAgICAgICAgICAgICAgICAgICBmb3I6IDEsICAgICAgICBmcmFtZTogMSwgICAgICAgICAgICAgZnJhbWVib3JkZXI6IDEsIGhlYWRlcnM6IDEsICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogMSwgICAgICAgaHJlZmxhbmc6IDEsICAgICAgICAgIGhzcGFjZTogMSwgICAgIFwiaHR0cC1lcXVpdlwiOiAxLCAgIGlkOiAxLFxuICAgICAgICAgICAgICAgICAgICBpc21hcDogMSwgICAgICBsYWJlbDogMSwgICAgICAgICAgICAgbGFuZzogMSwgICAgICAgIGxhbmd1YWdlOiAxLCAgICAgIGxpbms6IDEsXG4gICAgICAgICAgICAgICAgICAgIGxvbmdkZXNjOiAxLCAgIG1hcmdpbmhlaWdodDogMSwgICAgICBtYXJnaW53aWR0aDogMSwgbWF4bGVuZ3RoOiAxLCAgICAgbWVkaWE6IDEsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogMSwgICAgIG11bHRpcGxlOiAxLCAgICAgICAgICBuYW1lOiAxLCAgICAgICAgbm9ocmVmOiAxLCAgICAgICAgbm9yZXNpemU6IDEsXG4gICAgICAgICAgICAgICAgICAgIG5vc2hhZGU6IDEsICAgIG5vd3JhcDogMSwgICAgICAgICAgICBvYmplY3Q6IDEsICAgICAgb25ibHVyOiAxLCAgICAgICAgb25jaGFuZ2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9uY2xpY2s6IDEsICAgIG9uZGJsY2xpY2s6IDEsICAgICAgICBvbmZvY3VzOiAxLCAgICAgb25rZXlkb3duOiAxLCAgICAgb25rZXlwcmVzczogMSxcbiAgICAgICAgICAgICAgICAgICAgb25rZXl1cDogMSwgICAgb25sb2FkOiAxLCAgICAgICAgICAgIG9ubW91c2Vkb3duOiAxLCBvbm1vdXNlbW92ZTogMSwgICBvbm1vdXNlb3V0OiAxLFxuICAgICAgICAgICAgICAgICAgICBvbm1vdXNlb3ZlcjogMSxvbm1vdXNldXA6IDEsICAgICAgICAgb25yZXNldDogMSwgICAgIG9uc2VsZWN0OiAxLCAgICAgIG9uc3VibWl0OiAxLFxuICAgICAgICAgICAgICAgICAgICBvbnVubG9hZDogMSwgICBwcm9maWxlOiAxLCAgICAgICAgICAgcHJvbXB0OiAxLCAgICAgIHJlYWRvbmx5OiAxLCAgICAgIHJlbDogMSxcbiAgICAgICAgICAgICAgICAgICAgcmV2OiAxLCAgICAgICAgcm93czogMSwgICAgICAgICAgICAgIHJvd3NwYW46IDEsICAgICBydWxlczogMSwgICAgICAgICBzY2hlbWU6IDEsXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlOiAxLCAgICAgIHNjcm9sbGluZzogMSwgICAgICAgICBzZWxlY3RlZDogMSwgICAgc2hhcGU6IDEsICAgICAgICAgc2l6ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgc3BhbjogMSwgICAgICAgc3JjOiAxLCAgICAgICAgICAgICAgIHN0YW5kYnk6IDEsICAgICBzdGFydDogMSwgICAgICAgICBzdHlsZTogMSxcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogMSwgICAgdGFiaW5kZXg6IDEsICAgICAgICAgIHRhcmdldDogMSwgICAgICB0ZXh0OiAxLCAgICAgICAgICB0aXRsZTogMSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogMSwgICAgICAgdXNlbWFwOiAxLCAgICAgICAgICAgIHZhbGlnbjogMSwgICAgICB2YWx1ZTogMSwgICAgICAgICB2YWx1ZXR5cGU6IDEsXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IDEsICAgIHZsaW5rOiAxLCAgICAgICAgICAgICB2c3BhY2U6IDEsICAgICAgd2lkdGg6IDEgIH07XG5cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgSG9vayBVdGlsc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8vIEdpdmVuIGFuIG9iamVjdCAoY29udGV4dCkgYW5kIGEgcGF0aCwgY3JlYXRlIGEgTGF6eVZhbHVlIG9iamVjdCB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIG9iamVjdCBhdCBjb250ZXh0IGFuZCBhZGQgaXQgYXMgYW4gb2JzZXJ2ZXIgb2YgdGhlIGNvbnRleHQuXG5mdW5jdGlvbiBzdHJlYW1Qcm9wZXJ0eShjb250ZXh0LCBwYXRoKSB7XG5cbiAgLy8gTGF6eSB2YWx1ZSB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIGNvbnRleHQucGF0aFxuICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gY29udGV4dC5nZXQocGF0aCk7XG4gIH0sIHtjb250ZXh0OiBjb250ZXh0fSk7XG5cbiAgLy8gU2F2ZSBvdXIgcGF0aCBzbyBwYXJlbnQgbGF6eXZhbHVlcyBjYW4ga25vdyB0aGUgZGF0YSB2YXIgb3IgaGVscGVyIHRoZXkgYXJlIGdldHRpbmcgaW5mbyBmcm9tXG4gIGxhenlWYWx1ZS5wYXRoID0gcGF0aDtcblxuICAvLyBTYXZlIHRoZSBvYnNlcnZlciBhdCB0aGlzIHBhdGhcbiAgbGF6eVZhbHVlLmFkZE9ic2VydmVyKHBhdGgsIGNvbnRleHQpO1xuXG4gIHJldHVybiBsYXp5VmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdEhlbHBlcihtb3JwaCwgcGF0aCwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYsIGhlbHBlcikge1xuICB2YXIga2V5O1xuICAvLyBFeHRlbmQgb3B0aW9ucyB3aXRoIHRoZSBoZWxwZXIncyBjb250YWluZWluZyBNb3JwaCBlbGVtZW50LiBVc2VkIGJ5IHN0cmVhbWlmeSB0byB0cmFjayBkYXRhIG9ic2VydmVyc1xuICBvcHRpb25zLm1vcnBoID0gbW9ycGg7XG4gIG9wdGlvbnMuZWxlbWVudCA9IG1vcnBoO1xuICBvcHRpb25zLnBhdGggPSBwYXRoO1xuICBvcHRpb25zLmNvbnRleHQgPSBjb250ZXh0O1xuXG4gIC8vIEVuc3VyZSBlbnYgYW5kIGJsb2NrIHBhcmFtcyBkb24ndCBzaGFyZSBtZW1vcnkgd2l0aCBvdGhlciBoZWxwZXJzXG4gIGVudiA9IF8uY2xvbmUoZW52KTtcbiAgaWYoZW52LmJsb2NrUGFyYW1zKSBlbnYuYmxvY2tQYXJhbXMgPSBfLmNsb25lKGVudi5ibG9ja1BhcmFtcyk7XG5cbiAgLy8gQ3JlYXRlIGEgbGF6eSB2YWx1ZSB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIG91ciBldmFsdWF0ZWQgaGVscGVyLlxuICBvcHRpb25zLmxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKXtcbiAgICB2YXIgcGxhaW5QYXJhbXMgPSBbXSxcbiAgICAgICAgcGxhaW5IYXNoID0ge307XG5cbiAgICAvLyBBc3NlbWJsZSBvdXIgYXJncyBhbmQgaGFzaCB2YXJpYWJsZXMuIEZvciBlYWNoIGxhenl2YWx1ZSBwYXJhbSwgcHVzaCB0aGUgbGF6eVZhbHVlJ3MgdmFsdWUgc28gaGVscGVycyB3aXRoIG5vIGNvbmNlcHQgb2YgbGF6eXZhbHVlcy5cbiAgICBfLmVhY2gocGFyYW1zLCBmdW5jdGlvbihwYXJhbSwgaW5kZXgpe1xuICAgICAgcGxhaW5QYXJhbXMucHVzaCgoIChwYXJhbSAmJiBwYXJhbS5pc0xhenlWYWx1ZSkgPyBwYXJhbS52YWx1ZSgpIDogcGFyYW0gKSk7XG4gICAgfSk7XG4gICAgXy5lYWNoKGhhc2gsIGZ1bmN0aW9uKGhhc2gsIGtleSl7XG4gICAgICBwbGFpbkhhc2hba2V5XSA9IChoYXNoICYmIGhhc2guaXNMYXp5VmFsdWUpID8gaGFzaC52YWx1ZSgpIDogaGFzaDtcbiAgICB9KTtcblxuICAgIC8vIENhbGwgb3VyIGhlbHBlciBmdW5jdGlvbnMgd2l0aCBvdXIgYXNzZW1ibGVkIGFyZ3MuXG4gICAgcmV0dXJuIGhlbHBlci5hcHBseSgoY29udGV4dC5fX3Jvb3RfXyB8fCBjb250ZXh0KSwgW3BsYWluUGFyYW1zLCBwbGFpbkhhc2gsIG9wdGlvbnMsIGVudl0pO1xuXG4gIH0sIHttb3JwaDogb3B0aW9ucy5tb3JwaH0pO1xuXG4gIG9wdGlvbnMubGF6eVZhbHVlLnBhdGggPSBwYXRoO1xuXG4gIC8vIEZvciBlYWNoIHBhcmFtIG9yIGhhc2ggdmFsdWUgcGFzc2VkIHRvIG91ciBoZWxwZXIsIGFkZCBpdCB0byBvdXIgaGVscGVyJ3MgZGVwZW5kYW50IGxpc3QuIEhlbHBlciB3aWxsIHJlLWV2YWx1YXRlIHdoZW4gb25lIGNoYW5nZXMuXG4gIHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uKHBhcmFtKSB7XG4gICAgaWYgKHBhcmFtICYmIHBhcmFtLmlzTGF6eVZhbHVlKXsgb3B0aW9ucy5sYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUocGFyYW0pOyB9XG4gIH0pO1xuICBmb3Ioa2V5IGluIGhhc2gpe1xuICAgIGlmIChoYXNoW2tleV0gJiYgaGFzaFtrZXldLmlzTGF6eVZhbHVlKXsgb3B0aW9ucy5sYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUoaGFzaFtrZXldKTsgfVxuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnMubGF6eVZhbHVlO1xufVxuXG4vLyBHaXZlbiBhIHJvb3QgZWxlbWVudCwgY2xlYW5zIGFsbCBvZiB0aGUgbW9ycGggbGF6eVZhbHVlcyBmb3IgYSBnaXZlbiBzdWJ0cmVlXG5mdW5jdGlvbiBjbGVhblN1YnRyZWUobXV0YXRpb25zLCBvYnNlcnZlcil7XG4gIC8vIEZvciBlYWNoIG11dGF0aW9uIG9ic2VydmVkLCBpZiB0aGVyZSBhcmUgbm9kZXMgcmVtb3ZlZCwgZGVzdHJveSBhbGwgYXNzb2NpYXRlZCBsYXp5VmFsdWVzXG4gIG11dGF0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKG11dGF0aW9uKSB7XG4gICAgaWYobXV0YXRpb24ucmVtb3ZlZE5vZGVzKXtcbiAgICAgIF8uZWFjaChtdXRhdGlvbi5yZW1vdmVkTm9kZXMsIGZ1bmN0aW9uKG5vZGUsIGluZGV4KXtcbiAgICAgICAgJChub2RlKS53YWxrVGhlRE9NKGZ1bmN0aW9uKG4pe1xuICAgICAgICAgIGlmKG4uX19sYXp5VmFsdWUgJiYgbi5fX2xhenlWYWx1ZS5kZXN0cm95KCkpe1xuICAgICAgICAgICAgbi5fX2xhenlWYWx1ZS5kZXN0cm95KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbnZhciBzdWJ0cmVlT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjbGVhblN1YnRyZWUpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBEZWZhdWx0IEhvb2tzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuaG9va3MuZ2V0ID0gZnVuY3Rpb24gZ2V0KGVudiwgY29udGV4dCwgcGF0aCl7XG4gIGlmKHBhdGggPT09ICd0aGlzJykgcGF0aCA9ICcnO1xuICB2YXIga2V5LFxuICAgICAgcmVzdCA9ICQuc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgZmlyc3QgPSByZXN0LnNoaWZ0KCk7XG5cbiAgLy8gSWYgdGhpcyBwYXRoIHJlZmVyYW5jZXMgYSBibG9jayBwYXJhbSwgdXNlIHRoYXQgYXMgdGhlIGNvbnRleHQgaW5zdGVhZC5cbiAgaWYoZW52LmJsb2NrUGFyYW1zICYmIGVudi5ibG9ja1BhcmFtc1tmaXJzdF0pe1xuICAgIGNvbnRleHQgPSBlbnYuYmxvY2tQYXJhbXNbZmlyc3RdO1xuICAgIHBhdGggPSByZXN0LmpvaW4oJy4nKTtcbiAgfVxuXG4gIHJldHVybiBzdHJlYW1Qcm9wZXJ0eShjb250ZXh0LCBwYXRoKTtcbn07XG5cbmhvb2tzLnNldCA9IGZ1bmN0aW9uIHNldChlbnYsIGNvbnRleHQsIG5hbWUsIHZhbHVlKXtcbiAgZW52LmJsb2NrUGFyYW1zIHx8IChlbnYuYmxvY2tQYXJhbXMgPSB7fSk7XG4gIGVudi5ibG9ja1BhcmFtc1tuYW1lXSA9IHZhbHVlO1xufTtcblxuXG5ob29rcy5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQoZW52LCBwYXJhbXMpIHtcblxuICBpZihwYXJhbXMubGVuZ3RoID09PSAxKXtcbiAgICByZXR1cm4gcGFyYW1zWzBdO1xuICB9XG5cbiAgdmFyIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gXCJcIjtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcGFyYW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFsdWUgKz0gKHBhcmFtc1tpXS5pc0xhenlWYWx1ZSkgPyBwYXJhbXNbaV0udmFsdWUoKSA6IHBhcmFtc1tpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sIHtjb250ZXh0OiBwYXJhbXNbMF0uY29udGV4dH0pO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gcGFyYW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmKHBhcmFtc1tpXS5pc0xhenlWYWx1ZSkge1xuICAgICAgbGF6eVZhbHVlLmFkZERlcGVuZGVudFZhbHVlKHBhcmFtc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxhenlWYWx1ZTtcblxufTtcblxuaG9va3Muc3ViZXhwciA9IGZ1bmN0aW9uIHN1YmV4cHIoZW52LCBjb250ZXh0LCBoZWxwZXJOYW1lLCBwYXJhbXMsIGhhc2gpIHtcblxuICB2YXIgaGVscGVyID0gaGVscGVycy5sb29rdXBIZWxwZXIoaGVscGVyTmFtZSwgZW52KSxcbiAgbGF6eVZhbHVlO1xuXG4gIGlmIChoZWxwZXIpIHtcbiAgICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIoZmFsc2UsIGhlbHBlck5hbWUsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwge30sIGVudiwgaGVscGVyKTtcbiAgfSBlbHNlIHtcbiAgICBsYXp5VmFsdWUgPSBob29rcy5nZXQoZW52LCBjb250ZXh0LCBoZWxwZXJOYW1lKTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gcGFyYW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmKHBhcmFtc1tpXS5pc0xhenlWYWx1ZSkge1xuICAgICAgbGF6eVZhbHVlLmFkZERlcGVuZGVudFZhbHVlKHBhcmFtc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxhenlWYWx1ZTtcbn07XG5cbmhvb2tzLmJsb2NrID0gZnVuY3Rpb24gYmxvY2soZW52LCBtb3JwaCwgY29udGV4dCwgcGF0aCwgcGFyYW1zLCBoYXNoLCB0ZW1wbGF0ZSwgaW52ZXJzZSl7XG4gIHZhciBvcHRpb25zID0ge1xuICAgIG1vcnBoOiBtb3JwaCxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgaW52ZXJzZTogaW52ZXJzZVxuICB9O1xuXG4gIHZhciBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZSxcbiAgICAgIG9ic2VydmVyID0gc3VidHJlZU9ic2VydmVyLFxuICAgICAgaGVscGVyID0gaGVscGVycy5sb29rdXBIZWxwZXIocGF0aCwgZW52KTtcblxuICBpZighXy5pc0Z1bmN0aW9uKGhlbHBlcikpe1xuICAgIHJldHVybiBjb25zb2xlLmVycm9yKHBhdGggKyAnIGlzIG5vdCBhIHZhbGlkIGhlbHBlciEnKTtcbiAgfVxuXG4gIC8vIEFic3RyYWN0cyBvdXIgaGVscGVyIHRvIHByb3ZpZGUgYSBoYW5kbGViYXJzIHR5cGUgaW50ZXJmYWNlLiBDb25zdHJ1Y3RzIG91ciBMYXp5VmFsdWUuXG4gIGxhenlWYWx1ZSA9IGNvbnN0cnVjdEhlbHBlcihtb3JwaCwgcGF0aCwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYsIGhlbHBlcik7XG5cbiAgdmFyIHJlbmRlckhvb2sgPSBmdW5jdGlvbihsYXp5VmFsdWUpIHtcbiAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgdmFsID0gKF8uaXNVbmRlZmluZWQodmFsKSkgPyAnJyA6IHZhbDtcbiAgICBpZighXy5pc051bGwodmFsKSl7XG4gICAgICBtb3JwaC5zZXRDb250ZW50KHZhbCk7XG4gICAgfVxuICB9XG4gIGxhenlWYWx1ZS5vbk5vdGlmeShyZW5kZXJIb29rKTtcbiAgcmVuZGVySG9vayhsYXp5VmFsdWUpO1xuXG4gIC8vIE9ic2VydmUgdGhpcyBjb250ZW50IG1vcnBoJ3MgcGFyZW50J3MgY2hpbGRyZW4uXG4gIC8vIFdoZW4gdGhlIG1vcnBoIGVsZW1lbnQncyBjb250YWluaW5nIGVsZW1lbnQgKG1vcnBoKSBpcyByZW1vdmVkLCBjbGVhbiB1cCB0aGUgbGF6eXZhbHVlLlxuICAvLyBUaW1lb3V0IGRlbGF5IGhhY2sgdG8gZ2l2ZSBvdXQgZG9tIGEgY2hhbmdlIHRvIGdldCB0aGVpciBwYXJlbnRcbiAgaWYobW9ycGguX3BhcmVudCl7XG4gICAgbW9ycGguX3BhcmVudC5fX2xhenlWYWx1ZSA9IGxhenlWYWx1ZTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBpZihtb3JwaC5jb250ZXh0dWFsRWxlbWVudCl7XG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUobW9ycGguY29udGV4dHVhbEVsZW1lbnQsIHsgYXR0cmlidXRlczogZmFsc2UsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfSwgMCk7XG4gIH1cbn07XG5cbmhvb2tzLmlubGluZSA9IGZ1bmN0aW9uIGlubGluZShlbnYsIG1vcnBoLCBjb250ZXh0LCBwYXRoLCBwYXJhbXMsIGhhc2gpIHtcblxuICB2YXIgbGF6eVZhbHVlLFxuICB2YWx1ZSxcbiAgb2JzZXJ2ZXIgPSBzdWJ0cmVlT2JzZXJ2ZXIsXG4gIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudik7XG5cbiAgaWYoIV8uaXNGdW5jdGlvbihoZWxwZXIpKXtcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcihwYXRoICsgJyBpcyBub3QgYSB2YWxpZCBoZWxwZXIhJyk7XG4gIH1cblxuICAvLyBBYnN0cmFjdHMgb3VyIGhlbHBlciB0byBwcm92aWRlIGEgaGFuZGxlYmFycyB0eXBlIGludGVyZmFjZS4gQ29uc3RydWN0cyBvdXIgTGF6eVZhbHVlLlxuICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIobW9ycGgsIHBhdGgsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwge30sIGVudiwgaGVscGVyKTtcblxuICB2YXIgcmVuZGVySG9vayA9IGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgIHZhciB2YWwgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICB2YWwgPSAoXy5pc1VuZGVmaW5lZCh2YWwpKSA/ICcnIDogdmFsO1xuICAgIGlmKCFfLmlzTnVsbCh2YWwpKXtcbiAgICAgIG1vcnBoLnNldENvbnRlbnQodmFsKTtcbiAgICB9XG4gIH1cblxuICAvLyBJZiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlLCB1cGRhdGUgb3VyIGRvbS5cbiAgLy8gbW9ycGggaXMgYSBtb3JwaCBlbGVtZW50IHJlcHJlc2VudGluZyBvdXIgZG9tIG5vZGVcbiAgbGF6eVZhbHVlLm9uTm90aWZ5KHJlbmRlckhvb2spO1xuICByZW5kZXJIb29rKGxhenlWYWx1ZSlcblxuICAvLyBPYnNlcnZlIHRoaXMgY29udGVudCBtb3JwaCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAvLyBXaGVuIHRoZSBtb3JwaCBlbGVtZW50J3MgY29udGFpbmluZyBlbGVtZW50IChtb3JwaCkgaXMgcmVtb3ZlZCwgY2xlYW4gdXAgdGhlIGxhenl2YWx1ZS5cbiAgLy8gVGltZW91dCBkZWxheSBoYWNrIHRvIGdpdmUgb3V0IGRvbSBhIGNoYW5nZSB0byBnZXQgdGhlaXIgcGFyZW50XG4gIGlmKG1vcnBoLl9wYXJlbnQpe1xuICAgIG1vcnBoLl9wYXJlbnQuX19sYXp5VmFsdWUgPSBsYXp5VmFsdWU7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgaWYobW9ycGguY29udGV4dHVhbEVsZW1lbnQpe1xuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IGZhbHNlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH0sIDApO1xuICB9XG5cbn07XG5cbmhvb2tzLmNvbnRlbnQgPSBmdW5jdGlvbiBjb250ZW50KGVudiwgbW9ycGgsIGNvbnRleHQsIHBhdGgpIHtcblxuICB2YXIgbGF6eVZhbHVlLFxuICAgICAgdmFsdWUsXG4gICAgICBvYnNlcnZlciA9IHN1YnRyZWVPYnNlcnZlcixcbiAgICAgIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudik7XG5cbiAgaWYgKGhlbHBlcikge1xuICAgIGxhenlWYWx1ZSA9IGNvbnN0cnVjdEhlbHBlcihtb3JwaCwgcGF0aCwgY29udGV4dCwgW10sIHt9LCB7fSwgZW52LCBoZWxwZXIpO1xuICB9IGVsc2Uge1xuICAgIGxhenlWYWx1ZSA9IGhvb2tzLmdldChlbnYsIGNvbnRleHQsIHBhdGgpO1xuICB9XG5cbiAgdmFyIHJlbmRlckhvb2sgPSBmdW5jdGlvbihsYXp5VmFsdWUpIHtcbiAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgdmFsID0gKF8uaXNVbmRlZmluZWQodmFsKSkgPyAnJyA6IHZhbDtcbiAgICBpZighXy5pc051bGwodmFsKSkgbW9ycGguc2V0Q29udGVudCh2YWwpO1xuICB9XG5cbiAgLy8gSWYgd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSwgdXBkYXRlIG91ciBkb20uXG4gIC8vIG1vcnBoIGlzIGEgbW9ycGggZWxlbWVudCByZXByZXNlbnRpbmcgb3VyIGRvbSBub2RlXG4gIGxhenlWYWx1ZS5vbk5vdGlmeShyZW5kZXJIb29rKTtcbiAgcmVuZGVySG9vayhsYXp5VmFsdWUpO1xuXG4gIC8vIE9ic2VydmUgdGhpcyBjb250ZW50IG1vcnBoJ3MgcGFyZW50J3MgY2hpbGRyZW4uXG4gIC8vIFdoZW4gdGhlIG1vcnBoIGVsZW1lbnQncyBjb250YWluaW5nIGVsZW1lbnQgKG1vcnBoKSBpcyByZW1vdmVkLCBjbGVhbiB1cCB0aGUgbGF6eXZhbHVlLlxuICAvLyBUaW1lb3V0IGRlbGF5IGhhY2sgdG8gZ2l2ZSBvdXQgZG9tIGEgY2hhbmdlIHRvIGdldCB0aGVpciBwYXJlbnRcbiAgaWYobW9ycGguX3BhcmVudCl7XG4gICAgbW9ycGguX3BhcmVudC5fX2xhenlWYWx1ZSA9IGxhenlWYWx1ZTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBpZihtb3JwaC5jb250ZXh0dWFsRWxlbWVudCl7XG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUobW9ycGguY29udGV4dHVhbEVsZW1lbnQsIHsgYXR0cmlidXRlczogZmFsc2UsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfSwgMCk7XG4gIH1cblxufTtcblxuLy8gSGFuZGxlIG1vcnBocyBpbiBlbGVtZW50IHRhZ3Ncbi8vIFRPRE86IGhhbmRsZSBkeW5hbWljIGF0dHJpYnV0ZSBuYW1lcz9cbmhvb2tzLmVsZW1lbnQgPSBmdW5jdGlvbiBlbGVtZW50KGVudiwgZG9tRWxlbWVudCwgY29udGV4dCwgcGF0aCwgcGFyYW1zLCBoYXNoKSB7XG4gIHZhciBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYpLFxuICAgICAgbGF6eVZhbHVlLFxuICAgICAgdmFsdWU7XG5cbiAgaWYgKGhlbHBlcikge1xuICAgIC8vIEFic3RyYWN0cyBvdXIgaGVscGVyIHRvIHByb3ZpZGUgYSBoYW5kbGViYXJzIHR5cGUgaW50ZXJmYWNlLiBDb25zdHJ1Y3RzIG91ciBMYXp5VmFsdWUuXG4gICAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKGRvbUVsZW1lbnQsIHBhdGgsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwge30sIGVudiwgaGVscGVyKTtcbiAgfSBlbHNlIHtcbiAgICBsYXp5VmFsdWUgPSBob29rcy5nZXQoZW52LCBjb250ZXh0LCBwYXRoKTtcbiAgfVxuXG4gIHZhciByZW5kZXJIb29rID0gZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgbGF6eVZhbHVlLnZhbHVlKCk7XG4gIH1cblxuICAvLyBXaGVuIHdlIGhhdmUgb3VyIGxhenkgdmFsdWUgcnVuIGl0IGFuZCBzdGFydCBsaXN0ZW5pbmcgZm9yIHVwZGF0ZXMuXG4gIGxhenlWYWx1ZS5vbk5vdGlmeShyZW5kZXJIb29rKTtcbiAgcmVuZGVySG9vayhsYXp5VmFsdWUpO1xuXG59O1xuaG9va3MuYXR0cmlidXRlID0gZnVuY3Rpb24gYXR0cmlidXRlKGVudiwgYXR0ck1vcnBoLCBkb21FbGVtZW50LCBuYW1lLCB2YWx1ZSl7XG5cbiAgdmFyIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbCA9IHZhbHVlLnZhbHVlKCksXG4gICAgY2hlY2tib3hDaGFuZ2UsXG4gICAgdHlwZSA9IGRvbUVsZW1lbnQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSxcblxuICAgIGlucHV0VHlwZXMgPSB7ICAnbnVsbCc6IHRydWUsICAndGV4dCc6dHJ1ZSwgICAnZW1haWwnOnRydWUsICAncGFzc3dvcmQnOnRydWUsXG4gICAgICAgICAgICAgICAgICAgICdzZWFyY2gnOnRydWUsICd1cmwnOnRydWUsICAgICd0ZWwnOnRydWUsICAgICdoaWRkZW4nOnRydWUsXG4gICAgICAgICAgICAgICAgICAgICdudW1iZXInOnRydWUsICdjb2xvcic6IHRydWUsICdkYXRlJzogdHJ1ZSwgICdkYXRldGltZSc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICdkYXRldGltZS1sb2NhbDonOiB0cnVlLCAgICAgICdtb250aCc6IHRydWUsICdyYW5nZSc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICd0aW1lJzogdHJ1ZSwgICd3ZWVrJzogdHJ1ZVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICBhdHRyO1xuXG4gICAgLy8gSWYgaXMgYSB0ZXh0IGlucHV0IGVsZW1lbnQncyB2YWx1ZSBwcm9wIHdpdGggb25seSBvbmUgdmFyaWFibGUsIHdpcmUgZGVmYXVsdCBldmVudHNcbiAgICBpZiggZG9tRWxlbWVudC50YWdOYW1lID09PSAnSU5QVVQnICYmIGlucHV0VHlwZXNbdHlwZV0gJiYgbmFtZSA9PT0gJ3ZhbHVlJyApe1xuXG4gICAgICAvLyBJZiBvdXIgc3BlY2lhbCBpbnB1dCBldmVudHMgaGF2ZSBub3QgYmVlbiBib3VuZCB5ZXQsIGJpbmQgdGhlbSBhbmQgc2V0IGZsYWdcbiAgICAgIGlmKCFsYXp5VmFsdWUuaW5wdXRPYnNlcnZlcil7XG5cbiAgICAgICAgJChkb21FbGVtZW50KS5vbignY2hhbmdlIGlucHV0IHByb3BlcnR5Y2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgIHZhbHVlLnNldCh2YWx1ZS5wYXRoLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGF6eVZhbHVlLmlucHV0T2JzZXJ2ZXIgPSB0cnVlO1xuXG4gICAgICB9XG5cbiAgICAgIC8vIFNldCB0aGUgYXR0cmlidXRlIG9uIG91ciBlbGVtZW50IGZvciB2aXN1YWwgcmVmZXJhbmNlXG4gICAgICAoXy5pc1VuZGVmaW5lZCh2YWwpKSA/IGRvbUVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpIDogZG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKTtcblxuICAgICAgYXR0ciA9IHZhbDtcblxuICAgICAgcmV0dXJuIChkb21FbGVtZW50LnZhbHVlICE9PSBTdHJpbmcoYXR0cikpID8gZG9tRWxlbWVudC52YWx1ZSA9IChhdHRyIHx8ICcnKSA6IGF0dHI7XG4gICAgfVxuXG4gICAgZWxzZSBpZiggZG9tRWxlbWVudC50YWdOYW1lID09PSAnSU5QVVQnICYmICh0eXBlID09PSAnY2hlY2tib3gnIHx8IHR5cGUgPT09ICdyYWRpbycpICYmIG5hbWUgPT09ICdjaGVja2VkJyApe1xuXG4gICAgICAvLyBJZiBvdXIgc3BlY2lhbCBpbnB1dCBldmVudHMgaGF2ZSBub3QgYmVlbiBib3VuZCB5ZXQsIGJpbmQgdGhlbSBhbmQgc2V0IGZsYWdcbiAgICAgIGlmKCFsYXp5VmFsdWUuZXZlbnRzQm91bmQpe1xuXG4gICAgICAgICQoZG9tRWxlbWVudCkub24oJ2NoYW5nZSBwcm9wZXJ0eWNoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICB2YWx1ZS5zZXQodmFsdWUucGF0aCwgKCh0aGlzLmNoZWNrZWQpID8gdHJ1ZSA6IGZhbHNlKSwge3F1aWV0OiB0cnVlfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxhenlWYWx1ZS5ldmVudHNCb3VuZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldCB0aGUgYXR0cmlidXRlIG9uIG91ciBlbGVtZW50IGZvciB2aXN1YWwgcmVmZXJhbmNlXG4gICAgICAoIXZhbCkgPyBkb21FbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKSA6IGRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCk7XG5cbiAgICAgIHJldHVybiBkb21FbGVtZW50LmNoZWNrZWQgPSAodmFsKSA/IHRydWUgOiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gU3BlY2lhbCBjYXNlIGZvciBsaW5rIGVsZW1lbnRzIHdpdGggZHluYW1pYyBjbGFzc2VzLlxuICAgIC8vIElmIHRoZSByb3V0ZXIgaGFzIGFzc2lnbmVkIGl0IGEgdHJ1dGh5ICdhY3RpdmUnIHByb3BlcnR5LCBlbnN1cmUgdGhhdCB0aGUgZXh0cmEgY2xhc3MgaXMgcHJlc2VudCBvbiByZS1yZW5kZXIuXG4gICAgZWxzZSBpZiggZG9tRWxlbWVudC50YWdOYW1lID09PSAnQScgJiYgbmFtZSA9PT0gJ2NsYXNzJyApe1xuICAgICAgaWYoXy5pc1VuZGVmaW5lZCh2YWwpKXtcbiAgICAgICAgZG9tRWxlbWVudC5hY3RpdmUgPyBkb21FbGVtZW50LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnYWN0aXZlJykgOiBkb21FbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2NsYXNzJyk7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICBkb21FbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWwgKyAoZG9tRWxlbWVudC5hY3RpdmUgPyAnIGFjdGl2ZScgOiAnJykpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgXy5pc1N0cmluZyh2YWwpICYmICh2YWwgPSB2YWwudHJpbSgpKTtcbiAgICAgIHZhbCB8fCAodmFsID0gdW5kZWZpbmVkKTtcbiAgICAgIGlmKF8uaXNVbmRlZmluZWQodmFsKSl7XG4gICAgICAgIGRvbUVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgZG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xuXG4gIH0sIHthdHRyTW9ycGg6IGF0dHJNb3JwaH0pO1xuXG4gIHZhciByZW5kZXJIb29rID0gZnVuY3Rpb24oKXtcbiAgICBsYXp5VmFsdWUudmFsdWUoKTtcbiAgfVxuXG4gIHZhbHVlLm9uTm90aWZ5KHJlbmRlckhvb2spO1xuICBsYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUodmFsdWUpO1xuICByZW5kZXJIb29rKCk7XG59O1xuXG5ob29rcy5jb21wb25lbnQgPSBmdW5jdGlvbihlbnYsIG1vcnBoLCBjb250ZXh0LCB0YWdOYW1lLCBjb250ZXh0RGF0YSwgdGVtcGxhdGUpIHtcblxuICB2YXIgY29tcG9uZW50LFxuICAgICAgZWxlbWVudCxcbiAgICAgIG91dGxldCxcbiAgICAgIHBsYWluRGF0YSA9IHt9LFxuICAgICAgY29tcG9uZW50RGF0YSA9IHt9LFxuICAgICAgbGF6eVZhbHVlLFxuICAgICAgdmFsdWU7XG5cbiAgLy8gQ3JlYXRlIGEgbGF6eSB2YWx1ZSB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIG91ciBldmFsdWF0ZWQgY29tcG9uZW50LlxuICBsYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gQ3JlYXRlIGEgcGxhaW4gZGF0YSBvYmplY3QgZnJvbSB0aGUgbGF6eXZhbHVlcy92YWx1ZXMgcGFzc2VkIHRvIG91ciBjb21wb25lbnRcbiAgICBfLmVhY2goY29udGV4dERhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgIHBsYWluRGF0YVtrZXldID0gKHZhbHVlLmlzTGF6eVZhbHVlKSA/IHZhbHVlLnZhbHVlKCkgOiB2YWx1ZTtcbiAgICB9KTtcblxuICAgIC8vIEZvciBlYWNoIHBhcmFtIHBhc3NlZCB0byBvdXIgc2hhcmVkIGNvbXBvbmVudCwgYWRkIGl0IHRvIG91ciBjdXN0b20gZWxlbWVudFxuICAgIC8vIFRPRE86IHRoZXJlIGhhcyB0byBiZSBhIGJldHRlciB3YXkgdG8gZ2V0IHNlZWQgZGF0YSB0byBlbGVtZW50IGluc3RhbmNlc1xuICAgIC8vIEdsb2JhbCBzZWVkIGRhdGEgaXMgY29uc3VtZWQgYnkgZWxlbWVudCBhcyBpdHMgY3JlYXRlZC4gVGhpcyBpcyBub3Qgc2NvcGVkIGFuZCB2ZXJ5IGR1bWIuXG4gICAgUmVib3VuZC5zZWVkRGF0YSA9IHBsYWluRGF0YTtcbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgICBkZWxldGUgUmVib3VuZC5zZWVkRGF0YTtcbiAgICBjb21wb25lbnQgPSBlbGVtZW50Ll9fY29tcG9uZW50X187XG5cbiAgICAvLyBGb3IgZWFjaCBsYXp5IHBhcmFtIHBhc3NlZCB0byBvdXIgY29tcG9uZW50LCBjcmVhdGUgaXRzIGxhenlWYWx1ZVxuICAgIF8uZWFjaChwbGFpbkRhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgIGlmKGNvbnRleHREYXRhW2tleV0gJiYgY29udGV4dERhdGFba2V5XS5pc0xhenlWYWx1ZSl7XG4gICAgICAgIGNvbXBvbmVudERhdGFba2V5XSA9IGhvb2tzLmdldChlbnYsIGNvbXBvbmVudCwga2V5KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNldCB1cCB0d28gd2F5IGJpbmRpbmcgYmV0d2VlbiBjb21wb25lbnQgYW5kIG9yaWdpbmFsIGNvbnRleHQgZm9yIG5vbi1kYXRhIGF0dHJpYnV0ZXNcbiAgICAvLyBTeW5jaW5nIGJldHdlZW4gbW9kZWxzIGFuZCBjb2xsZWN0aW9ucyBwYXNzZWQgYXJlIGhhbmRsZWQgaW4gbW9kZWwgYW5kIGNvbGxlY3Rpb25cbiAgICBfLmVhY2goIGNvbXBvbmVudERhdGEsIGZ1bmN0aW9uKGNvbXBvbmVudERhdGFWYWx1ZSwga2V5KXtcblxuICAgICAgLy8gVE9ETzogTWFrZSB0aGlzIHN5bmMgd29yayB3aXRoIGNvbXBsZXggYXJndW1lbnRzIHdpdGggbW9yZSB0aGFuIG9uZSBjaGlsZFxuICAgICAgaWYoY29udGV4dERhdGFba2V5XS5jaGlsZHJlbiA9PT0gbnVsbCl7XG4gICAgICAgIC8vIEZvciBlYWNoIGxhenkgcGFyYW0gcGFzc2VkIHRvIG91ciBjb21wb25lbnQsIGhhdmUgaXQgdXBkYXRlIHRoZSBvcmlnaW5hbCBjb250ZXh0IHdoZW4gY2hhbmdlZC5cbiAgICAgICAgY29tcG9uZW50RGF0YVZhbHVlLm9uTm90aWZ5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgY29udGV4dERhdGFba2V5XS5zZXQoY29udGV4dERhdGFba2V5XS5wYXRoLCBjb21wb25lbnREYXRhVmFsdWUudmFsdWUoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgZWFjaCBsYXp5IHBhcmFtIHBhc3NlZCB0byBvdXIgY29tcG9uZW50LCBoYXZlIGl0IHVwZGF0ZSB0aGUgY29tcG9uZW50IHdoZW4gY2hhbmdlZC5cbiAgICAgIGNvbnRleHREYXRhW2tleV0ub25Ob3RpZnkoZnVuY3Rpb24oKXtcbiAgICAgICAgY29tcG9uZW50RGF0YVZhbHVlLnNldChrZXksIGNvbnRleHREYXRhW2tleV0udmFsdWUoKSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2VlZCB0aGUgY2FjaGVcbiAgICAgIGNvbXBvbmVudERhdGFWYWx1ZS52YWx1ZSgpO1xuXG4gICAgICAvLyBOb3RpZnkgdGhlIGNvbXBvbmVudCdzIGxhenl2YWx1ZSB3aGVuIG91ciBtb2RlbCB1cGRhdGVzXG4gICAgICBjb250ZXh0RGF0YVtrZXldLmFkZE9ic2VydmVyKGNvbnRleHREYXRhW2tleV0ucGF0aCwgY29udGV4dCk7XG4gICAgICBjb21wb25lbnREYXRhVmFsdWUuYWRkT2JzZXJ2ZXIoa2V5LCBjb21wb25lbnQpO1xuXG4gICAgfSk7XG5cbiAgICAvLyAvLyBGb3IgZWFjaCBjaGFuZ2Ugb24gb3VyIGNvbXBvbmVudCwgdXBkYXRlIHRoZSBzdGF0ZXMgb2YgdGhlIG9yaWdpbmFsIGNvbnRleHQgYW5kIHRoZSBlbGVtZW50J3MgcHJvZXBydGllcy5cbiAgICBjb21wb25lbnQubGlzdGVuVG8oY29tcG9uZW50LCAnY2hhbmdlJywgZnVuY3Rpb24obW9kZWwpe1xuICAgICAgdmFyIGpzb24gPSBjb21wb25lbnQudG9KU09OKCk7XG5cbiAgICAgIGlmKF8uaXNTdHJpbmcoanNvbikpIHJldHVybjsgLy8gSWYgaXMgYSBzdHJpbmcsIHRoaXMgbW9kZWwgaXMgc2VyYWxpemluZyBhbHJlYWR5XG5cbiAgICAgIC8vIFNldCB0aGUgcHJvcGVydGllcyBvbiBvdXIgZWxlbWVudCBmb3IgdmlzdWFsIHJlZmVyYW5jZSBpZiB3ZSBhcmUgb24gYSB0b3AgbGV2ZWwgYXR0cmlidXRlXG4gICAgICBfLmVhY2goanNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICAgIC8vIFRPRE86IEN1cnJlbnRseSwgc2hvd2luZyBvYmplY3RzIGFzIHByb3BlcnRpZXMgb24gdGhlIGN1c3RvbSBlbGVtZW50IGNhdXNlcyBwcm9ibGVtcy5cbiAgICAgICAgLy8gTGlua2VkIG1vZGVscyBiZXR3ZWVuIHRoZSBjb250ZXh0IGFuZCBjb21wb25lbnQgYmVjb21lIHRoZSBzYW1lIGV4YWN0IG1vZGVsIGFuZCBhbGwgaGVsbCBicmVha3MgbG9vc2UuXG4gICAgICAgIC8vIEZpbmQgYSB3YXkgdG8gcmVtZWR5IHRoaXMuIFVudGlsIHRoZW4sIGRvbid0IHNob3cgb2JqZWN0cy5cbiAgICAgICAgaWYoKF8uaXNPYmplY3QodmFsdWUpKSl7IHJldHVybjsgfVxuICAgICAgICB2YWx1ZSA9IChfLmlzT2JqZWN0KHZhbHVlKSkgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICB0cnl7IChhdHRyaWJ1dGVzW2tleV0pID8gZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkgOiBlbGVtZW50LmRhdGFzZXRba2V5XSA9IHZhbHVlOyB9XG4gICAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKiogVGhlIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayBvbiBvdXIgY3VzdG9tIGVsZW1lbnQgdXBkYXRlcyB0aGUgY29tcG9uZW50J3MgZGF0YS4gKiovXG5cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgRW5kIGRhdGEgZGVwZW5kYW5jeSBjaGFpblxuXG4gICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIFRPRE86IGJyZWFrIHRoaXMgb3V0IGludG8gaXRzIG93biBmdW5jdGlvblxuICAgIC8vIFNldCB0aGUgcHJvcGVydGllcyBvbiBvdXIgZWxlbWVudCBmb3IgdmlzdWFsIHJlZmVyYW5jZSBpZiB3ZSBhcmUgb24gYSB0b3AgbGV2ZWwgYXR0cmlidXRlXG4gICAgdmFyIGNvbXBqc29uID0gY29tcG9uZW50LnRvSlNPTigpO1xuICAgIF8uZWFjaChjb21wanNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICAvLyBUT0RPOiBDdXJyZW50bHksIHNob3dpbmcgb2JqZWN0cyBhcyBwcm9wZXJ0aWVzIG9uIHRoZSBjdXN0b20gZWxlbWVudCBjYXVzZXMgcHJvYmxlbXMuXG4gICAgICAvLyBMaW5rZWQgbW9kZWxzIGJldHdlZW4gdGhlIGNvbnRleHQgYW5kIGNvbXBvbmVudCBiZWNvbWUgdGhlIHNhbWUgZXhhY3QgbW9kZWwgYW5kIGFsbCBoZWxsIGJyZWFrcyBsb29zZS5cbiAgICAgIC8vIEZpbmQgYSB3YXkgdG8gcmVtZWR5IHRoaXMuIFVudGlsIHRoZW4sIGRvbid0IHNob3cgb2JqZWN0cy5cbiAgICAgIGlmKChfLmlzT2JqZWN0KHZhbHVlKSkpeyByZXR1cm47IH1cbiAgICAgIHZhbHVlID0gKF8uaXNPYmplY3QodmFsdWUpKSA/IEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6IHZhbHVlO1xuICAgICAgaWYoIV8uaXNOdWxsKHZhbHVlKSAmJiAhXy5pc1VuZGVmaW5lZCh2YWx1ZSkpe1xuICAgICAgICB0cnl7IChhdHRyaWJ1dGVzW2tleV0pID8gZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkgOiBlbGVtZW50LmRhdGFzZXRba2V5XSA9IHZhbHVlOyB9XG4gICAgICAgIGNhdGNoKGUpe1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICAvLyBJZiBhbiBvdXRsZXQgbWFya2VyIGlzIHByZXNlbnQgaW4gY29tcG9uZW50J3MgdGVtcGxhdGUsIGFuZCBhIHRlbXBsYXRlIGlzIHByb3ZpZGVkLCByZW5kZXIgaXQgaW50byA8Y29udGVudD5cbiAgICBvdXRsZXQgPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb250ZW50JylbMF07XG4gICAgaWYodGVtcGxhdGUgJiYgXy5pc0VsZW1lbnQob3V0bGV0KSl7XG4gICAgICBvdXRsZXQuaW5uZXJIVE1MID0gJyc7XG4gICAgICBvdXRsZXQuYXBwZW5kQ2hpbGQodGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIGVudiwgb3V0bGV0KSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBuZXcgZWxlbWVudC5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfSwge21vcnBoOiBtb3JwaH0pO1xuXG4gIHZhciByZW5kZXJIb29rID0gZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgdmFyIHZhbCA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkKXsgbW9ycGguc2V0Q29udGVudCh2YWwpOyB9XG4gIH1cblxuICAvLyBJZiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlLCB1cGRhdGUgb3VyIGRvbS5cbiAgLy8gbW9ycGggaXMgYSBtb3JwaCBlbGVtZW50IHJlcHJlc2VudGluZyBvdXIgZG9tIG5vZGVcbiAgaWYgKGxhenlWYWx1ZSkge1xuICAgIGxhenlWYWx1ZS5vbk5vdGlmeShyZW5kZXJIb29rKTtcbiAgICByZW5kZXJIb29rKGxhenlWYWx1ZSk7XG4gIH1cbn07XG5cbi8vIHJlZ2lzdGVySGVscGVyIGlzIGEgcHVibGljYWxseSBhdmFpbGFibGUgZnVuY3Rpb24gdG8gcmVnaXN0ZXIgYSBoZWxwZXIgd2l0aCBIVE1MQmFyc1xuXG5leHBvcnQgZGVmYXVsdCBob29rcztcbiIsIi8vIFJlYm91bmQgTW9kZWxcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuLy8gUmVib3VuZCAqKk1vZGVscyoqIGFyZSB0aGUgYmFzaWMgZGF0YSBvYmplY3QgaW4gdGhlIGZyYW1ld29yayDigJQgZnJlcXVlbnRseVxuLy8gcmVwcmVzZW50aW5nIGEgcm93IGluIGEgdGFibGUgaW4gYSBkYXRhYmFzZSBvbiB5b3VyIHNlcnZlci4gVGhlIGluaGVyaXQgZnJvbVxuLy8gQmFja2JvbmUgTW9kZWxzIGFuZCBoYXZlIGFsbCBvZiB0aGUgc2FtZSB1c2VmdWwgbWV0aG9kcyB5b3UgYXJlIHVzZWQgdG8gZm9yXG4vLyBwZXJmb3JtaW5nIGNvbXB1dGF0aW9ucyBhbmQgdHJhbnNmb3JtYXRpb25zIG9uIHRoYXQgZGF0YS4gUmVib3VuZCBhdWdtZW50c1xuLy8gQmFja2JvbmUgTW9kZWxzIGJ5IGVuYWJsaW5nIGRlZXAgZGF0YSBuZXN0aW5nLiBZb3UgY2FuIG5vdyBoYXZlICoqUmVib3VuZCBDb2xsZWN0aW9ucyoqXG4vLyBhbmQgKipSZWJvdW5kIENvbXB1dGVkIFByb3BlcnRpZXMqKiBhcyBwcm9wZXJ0aWVzIG9mIHRoZSBNb2RlbC5cblxuaW1wb3J0IENvbXB1dGVkUHJvcGVydHkgZnJvbSBcInJlYm91bmQtZGF0YS9jb21wdXRlZC1wcm9wZXJ0eVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbi8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0LCB3aGVuIGNhbGxlZCwgZ2VuZXJhdGVzIGEgcGF0aCBjb25zdHJ1Y3RlZCBmcm9tIGl0c1xuLy8gcGFyZW50J3MgcGF0aCBhbmQgdGhlIGtleSBpdCBpcyBhc3NpZ25lZCB0by4gS2VlcHMgdXMgZnJvbSByZS1uYW1pbmcgY2hpbGRyZW5cbi8vIHdoZW4gcGFyZW50cyBjaGFuZ2UuXG5mdW5jdGlvbiBwYXRoR2VuZXJhdG9yKHBhcmVudCwga2V5KXtcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgdmFyIHBhdGggPSBwYXJlbnQuX19wYXRoKCk7XG4gICAgcmV0dXJuIHBhdGggKyAoKHBhdGggPT09ICcnKSA/ICcnIDogJy4nKSArIGtleTtcbiAgfTtcbn1cblxudmFyIE1vZGVsID0gQmFja2JvbmUuTW9kZWwuZXh0ZW5kKHtcbiAgLy8gU2V0IHRoaXMgb2JqZWN0J3MgZGF0YSB0eXBlc1xuICBpc01vZGVsOiB0cnVlLFxuICBpc0RhdGE6IHRydWUsXG5cbiAgLy8gQSBtZXRob2QgdGhhdCByZXR1cm5zIGEgcm9vdCBwYXRoIGJ5IGRlZmF1bHQuIE1lYW50IHRvIGJlIG92ZXJyaWRkZW4gb25cbiAgLy8gaW5zdGFudGlhdGlvbi5cbiAgX19wYXRoOiBmdW5jdGlvbigpeyByZXR1cm4gJyc7IH0sXG5cbiAgLy8gQ3JlYXRlIGEgbmV3IE1vZGVsIHdpdGggdGhlIHNwZWNpZmllZCBhdHRyaWJ1dGVzLiBUaGUgTW9kZWwncyBsaW5lYWdlIGlzIHNldFxuICAvLyB1cCBoZXJlIHRvIGtlZXAgdHJhY2sgb2YgaXQncyBwbGFjZSBpbiB0aGUgZGF0YSB0cmVlLlxuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24oYXR0cmlidXRlcywgb3B0aW9ucyl7XG4gICAgYXR0cmlidXRlcyB8fCAoYXR0cmlidXRlcyA9IHt9KTtcbiAgICBhdHRyaWJ1dGVzLmlzTW9kZWwgJiYgKGF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzLmF0dHJpYnV0ZXMpO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdGhpcy5oZWxwZXJzID0ge307XG4gICAgdGhpcy5kZWZhdWx0cyA9IHRoaXMuZGVmYXVsdHMgfHwge307XG4gICAgdGhpcy5zZXRQYXJlbnQoIG9wdGlvbnMucGFyZW50IHx8IHRoaXMgKTtcbiAgICB0aGlzLnNldFJvb3QoIG9wdGlvbnMucm9vdCB8fCB0aGlzICk7XG4gICAgdGhpcy5fX3BhdGggPSBvcHRpb25zLnBhdGggfHwgdGhpcy5fX3BhdGg7XG4gICAgQmFja2JvbmUuTW9kZWwuY2FsbCggdGhpcywgYXR0cmlidXRlcywgb3B0aW9ucyApO1xuICB9LFxuXG4gIC8vIE5ldyBjb252ZW5pZW5jZSBmdW5jdGlvbiB0byB0b2dnbGUgYm9vbGVhbiB2YWx1ZXMgaW4gdGhlIE1vZGVsLlxuICB0b2dnbGU6IGZ1bmN0aW9uKGF0dHIsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyA/IF8uY2xvbmUob3B0aW9ucykgOiB7fTtcbiAgICB2YXIgdmFsID0gdGhpcy5nZXQoYXR0cik7XG4gICAgaWYoIV8uaXNCb29sZWFuKHZhbCkpIGNvbnNvbGUuZXJyb3IoJ1RyaWVkIHRvIHRvZ2dsZSBub24tYm9vbGVhbiB2YWx1ZSAnICsgYXR0ciArJyEnLCB0aGlzKTtcbiAgICByZXR1cm4gdGhpcy5zZXQoYXR0ciwgIXZhbCwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgLy8gTW9kZWwgUmVzZXQgZG9lcyBhIGRlZXAgcmVzZXQgb24gdGhlIGRhdGEgdHJlZSBzdGFydGluZyBhdCB0aGlzIE1vZGVsLlxuICAvLyBBIGBwcmV2aW91c0F0dHJpYnV0ZXNgIHByb3BlcnR5IGlzIHNldCBvbiB0aGUgYG9wdGlvbnNgIHByb3BlcnR5IHdpdGggdGhlIE1vZGVsJ3NcbiAgLy8gb2xkIHZhbHVlcy5cbiAgcmVzZXQ6IGZ1bmN0aW9uKG9iaiwgb3B0aW9ucyl7XG4gICAgdmFyIGNoYW5nZWQgPSB7fSwga2V5LCB2YWx1ZTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIG9wdGlvbnMucmVzZXQgPSB0cnVlO1xuICAgIG9iaiA9IChvYmogJiYgb2JqLmlzTW9kZWwgJiYgb2JqLmF0dHJpYnV0ZXMpIHx8IG9iaiB8fCB7fTtcbiAgICBvcHRpb25zLnByZXZpb3VzQXR0cmlidXRlcyA9IF8uY2xvbmUodGhpcy5hdHRyaWJ1dGVzKTtcblxuICAgIC8vIEl0ZXJhdGUgb3ZlciB0aGUgTW9kZWwncyBhdHRyaWJ1dGVzOlxuICAgIC8vIC0gSWYgdGhlIHByb3BlcnR5IGlzIHRoZSBgaWRBdHRyaWJ1dGVgLCBza2lwLlxuICAgIC8vIC0gSWYgdGhlIHByb3BlcnR5IGlzIGEgYE1vZGVsYCwgYENvbGxlY3Rpb25gLCBvciBgQ29tcHV0ZWRQcm9wZXJ0eWAsIHJlc2V0IGl0LlxuICAgIC8vIC0gSWYgdGhlIHBhc3NlZCBvYmplY3QgaGFzIHRoZSBwcm9wZXJ0eSwgc2V0IGl0IHRvIHRoZSBuZXcgdmFsdWUuXG4gICAgLy8gLSBJZiB0aGUgTW9kZWwgaGFzIGEgZGVmYXVsdCB2YWx1ZSBmb3IgdGhpcyBwcm9wZXJ0eSwgc2V0IGl0IGJhY2sgdG8gZGVmYXVsdC5cbiAgICAvLyAtIE90aGVyd2lzZSwgdW5zZXQgdGhlIGF0dHJpYnV0ZS5cbiAgICBmb3Ioa2V5IGluIHRoaXMuYXR0cmlidXRlcyl7XG4gICAgICB2YWx1ZSA9IHRoaXMuYXR0cmlidXRlc1trZXldO1xuICAgICAgaWYodmFsdWUgPT09IG9ialtrZXldKSBjb250aW51ZTtcbiAgICAgIGVsc2UgaWYoXy5pc1VuZGVmaW5lZCh2YWx1ZSkpIG9ialtrZXldICYmIChjaGFuZ2VkW2tleV0gPSBvYmpba2V5XSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IHRoaXMuaWRBdHRyaWJ1dGUpIGNvbnRpbnVlO1xuICAgICAgZWxzZSBpZiAodmFsdWUuaXNDb2xsZWN0aW9uIHx8IHZhbHVlLmlzTW9kZWwgfHwgdmFsdWUuaXNDb21wdXRlZFByb3BlcnR5KXtcbiAgICAgICAgdmFsdWUucmVzZXQoKG9ialtrZXldfHxbXSksIHtzaWxlbnQ6IHRydWV9KTtcbiAgICAgICAgaWYodmFsdWUuaXNDb2xsZWN0aW9uKSBjaGFuZ2VkW2tleV0gPSBbXTtcbiAgICAgICAgZWxzZSBpZih2YWx1ZS5pc01vZGVsICYmIHZhbHVlLmlzQ29tcHV0ZWRQcm9wZXJ0eSkgY2hhbmdlZFtrZXldID0gdmFsdWUuY2FjaGUubW9kZWwuY2hhbmdlZDtcbiAgICAgICAgZWxzZSBpZih2YWx1ZS5pc01vZGVsKSBjaGFuZ2VkW2tleV0gPSB2YWx1ZS5jaGFuZ2VkXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSl7IGNoYW5nZWRba2V5XSA9IG9ialtrZXldOyB9XG4gICAgICBlbHNlIGlmICh0aGlzLmRlZmF1bHRzLmhhc093blByb3BlcnR5KGtleSkgJiYgIV8uaXNGdW5jdGlvbih0aGlzLmRlZmF1bHRzW2tleV0pKXtcbiAgICAgICAgY2hhbmdlZFtrZXldID0gb2JqW2tleV0gPSB0aGlzLmRlZmF1bHRzW2tleV07XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICBjaGFuZ2VkW2tleV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMudW5zZXQoa2V5LCB7c2lsZW50OiB0cnVlfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIEFueSB1bnNldCBjaGFuZ2VkIHZhbHVlcyB3aWxsIGJlIHNldCB0byBvYmpba2V5XVxuICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iail7XG4gICAgICBjaGFuZ2VkW2tleV0gPSBjaGFuZ2VkW2tleV0gfHwgb2JqW2tleV07XG4gICAgfSk7XG5cbiAgICAvLyBSZXNldCBvdXIgbW9kZWxcbiAgICBvYmogPSB0aGlzLnNldChvYmosIF8uZXh0ZW5kKHt9LCBvcHRpb25zLCB7c2lsZW50OiB0cnVlLCByZXNldDogZmFsc2V9KSk7XG5cbiAgICAvLyBUcmlnZ2VyIGN1c3RvbSByZXNldCBldmVudFxuICAgIHRoaXMuY2hhbmdlZCA9IGNoYW5nZWQ7XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy50cmlnZ2VyKCdyZXNldCcsIHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgLy8gUmV0dXJuIG5ldyB2YWx1ZXNcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIC8vICoqTW9kZWwuR2V0KiogaXMgb3ZlcnJpZGRlbiB0byBwcm92aWRlIHN1cHBvcnQgZm9yIGdldHRpbmcgZnJvbSBhIGRlZXAgZGF0YSB0cmVlLlxuICAvLyBga2V5YCBtYXkgbm93IGJlIGFueSB2YWxpZCBqc29uLWxpa2UgaWRlbnRpZmllci4gRXg6IGBvYmouY29sbFszXS52YWx1ZWAuXG4gIC8vIEl0IG5lZWRzIHRvIHRyYXZlcnNlIGBNb2RlbHNgLCBgQ29sbGVjdGlvbnNgIGFuZCBgQ29tcHV0ZWQgUHJvcGVydGllc2AgdG9cbiAgLy8gZmluZCB0aGUgY29ycmVjdCB2YWx1ZS5cbiAgLy8gLSBJZiBrZXkgaXMgdW5kZWZpbmVkLCByZXR1cm4gYHVuZGVmaW5lZGAuXG4gIC8vIC0gSWYga2V5IGlzIGVtcHR5IHN0cmluZywgcmV0dXJuIGB0aGlzYC5cbiAgLy9cbiAgLy8gRm9yIGVhY2ggcGFydDpcbiAgLy8gLSBJZiBhIGBDb21wdXRlZCBQcm9wZXJ0eWAgYW5kIGBvcHRpb25zLnJhd2AgaXMgdHJ1ZSwgcmV0dXJuIGl0LlxuICAvLyAtIElmIGEgYENvbXB1dGVkIFByb3BlcnR5YCB0cmF2ZXJzZSB0byBpdHMgdmFsdWUuXG4gIC8vIC0gSWYgbm90IHNldCwgcmV0dXJuIGl0cyBmYWxzeSB2YWx1ZS5cbiAgLy8gLSBJZiBhIGBNb2RlbGAsIGBDb2xsZWN0aW9uYCwgb3IgcHJpbWl0aXZlIHZhbHVlLCB0cmF2ZXJzZSB0byBpdC5cbiAgZ2V0OiBmdW5jdGlvbihrZXksIG9wdGlvbnMpe1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdmFyIHBhcnRzICA9ICQuc3BsaXRQYXRoKGtleSksXG4gICAgICAgIHJlc3VsdCA9IHRoaXMsXG4gICAgICAgIGksIGw9cGFydHMubGVuZ3RoO1xuXG4gICAgaWYoXy5pc1VuZGVmaW5lZChrZXkpIHx8IF8uaXNOdWxsKGtleSkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgaWYoa2V5ID09PSAnJyB8fCBwYXJ0cy5sZW5ndGggPT09IDApIHJldHVybiByZXN1bHQ7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiBvcHRpb25zLnJhdykgcmV0dXJuIHJlc3VsdDtcbiAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5KSByZXN1bHQgPSByZXN1bHQudmFsdWUoKTtcbiAgICAgIGlmKF8uaXNVbmRlZmluZWQocmVzdWx0KSB8fCBfLmlzTnVsbChyZXN1bHQpKSByZXR1cm4gcmVzdWx0O1xuICAgICAgaWYocGFydHNbaV0gPT09ICdAcGFyZW50JykgcmVzdWx0ID0gcmVzdWx0Ll9fcGFyZW50X187XG4gICAgICBlbHNlIGlmKHJlc3VsdC5pc0NvbGxlY3Rpb24pIHJlc3VsdCA9IHJlc3VsdC5tb2RlbHNbcGFydHNbaV1dO1xuICAgICAgZWxzZSBpZihyZXN1bHQuaXNNb2RlbCkgcmVzdWx0ID0gcmVzdWx0LmF0dHJpYnV0ZXNbcGFydHNbaV1dO1xuICAgICAgZWxzZSBpZihyZXN1bHQgJiYgcmVzdWx0Lmhhc093blByb3BlcnR5KHBhcnRzW2ldKSkgcmVzdWx0ID0gcmVzdWx0W3BhcnRzW2ldXTtcbiAgICB9XG5cbiAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiAhb3B0aW9ucy5yYXcpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cblxuICAvLyAqKk1vZGVsLlNldCoqIGlzIG92ZXJyaWRkZW4gdG8gcHJvdmlkZSBzdXBwb3J0IGZvciBnZXR0aW5nIGZyb20gYSBkZWVwIGRhdGEgdHJlZS5cbiAgLy8gYGtleWAgbWF5IG5vdyBiZSBhbnkgdmFsaWQganNvbi1saWtlIGlkZW50aWZpZXIuIEV4OiBgb2JqLmNvbGxbM10udmFsdWVgLlxuICAvLyBJdCBuZWVkcyB0byB0cmF2ZXJzZSBgTW9kZWxzYCwgYENvbGxlY3Rpb25zYCBhbmQgYENvbXB1dGVkIFByb3BlcnRpZXNgIHRvXG4gIC8vIGZpbmQgdGhlIGNvcnJlY3QgdmFsdWUgdG8gY2FsbCB0aGUgb3JpZ2luYWwgYEJhY2tib25lLlNldGAgb24uXG4gIHNldDogZnVuY3Rpb24oa2V5LCB2YWwsIG9wdGlvbnMpe1xuXG4gICAgdmFyIGF0dHJzLCBhdHRyLCBuZXdLZXksIHRhcmdldCwgZGVzdGluYXRpb24sIHByb3BzID0gW10sIGxpbmVhZ2U7XG5cbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGF0dHJzID0gKGtleS5pc01vZGVsKSA/IGtleS5hdHRyaWJ1dGVzIDoga2V5O1xuICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICB9XG4gICAgZWxzZSAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgLy8gSWYgcmVzZXQgb3B0aW9uIHBhc3NlZCwgZG8gYSByZXNldC4gSWYgbm90aGluZyBwYXNzZWQsIHJldHVybi5cbiAgICBpZihvcHRpb25zLnJlc2V0ID09PSB0cnVlKSByZXR1cm4gdGhpcy5yZXNldChhdHRycywgb3B0aW9ucyk7XG4gICAgaWYob3B0aW9ucy5kZWZhdWx0cyA9PT0gdHJ1ZSkgdGhpcy5kZWZhdWx0cyA9IGF0dHJzO1xuICAgIGlmKF8uaXNFbXB0eShhdHRycykpIHJldHVybjtcblxuICAgIC8vIEZvciBlYWNoIGF0dHJpYnV0ZSBwYXNzZWQ6XG4gICAgZm9yKGtleSBpbiBhdHRycyl7XG4gICAgICB2YXIgdmFsID0gYXR0cnNba2V5XSxcbiAgICAgICAgICBwYXRocyA9ICQuc3BsaXRQYXRoKGtleSksXG4gICAgICAgICAgYXR0ciAgPSBwYXRocy5wb3AoKSB8fCAnJzsgICAgICAgICAgIC8vIFRoZSBrZXkgICAgICAgIGV4OiBmb29bMF0uYmFyIC0tPiBiYXJcbiAgICAgICAgICB0YXJnZXQgPSB0aGlzLmdldChwYXRocy5qb2luKCcuJykpLCAgLy8gVGhlIGVsZW1lbnQgICAgZXg6IGZvby5iYXIuYmF6IC0tPiBmb28uYmFyXG4gICAgICAgICAgbGluZWFnZTtcblxuICAgICAgLy8gSWYgdGFyZ2V0IGN1cnJlbnRseSBkb2VzbnQgZXhpc3QsIGNvbnN0cnVjdCBpdHMgdHJlZVxuICAgICAgaWYoXy5pc1VuZGVmaW5lZCh0YXJnZXQpKXtcbiAgICAgICAgdGFyZ2V0ID0gdGhpcztcbiAgICAgICAgXy5lYWNoKHBhdGhzLCBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgICAgdmFyIHRtcCA9IHRhcmdldC5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmKF8uaXNVbmRlZmluZWQodG1wKSkgdG1wID0gdGFyZ2V0LnNldCh2YWx1ZSwge30pLmdldCh2YWx1ZSk7XG4gICAgICAgICAgdGFyZ2V0ID0gdG1wO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIG9sZCB2YWx1ZSBvZiBgYXR0cmAgaW4gYHRhcmdldGBcbiAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHRhcmdldC5nZXQoYXR0ciwge3JhdzogdHJ1ZX0pIHx8IHt9O1xuXG4gICAgICAvLyBDcmVhdGUgdGhpcyBuZXcgb2JqZWN0J3MgbGluZWFnZS5cbiAgICAgIGxpbmVhZ2UgPSB7XG4gICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgcGFyZW50OiB0YXJnZXQsXG4gICAgICAgIHJvb3Q6IHRoaXMuX19yb290X18sXG4gICAgICAgIHBhdGg6IHBhdGhHZW5lcmF0b3IodGFyZ2V0LCBrZXkpLFxuICAgICAgICBzaWxlbnQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHRzOiBvcHRpb25zLmRlZmF1bHRzXG4gICAgICB9XG4gICAgICAvLyAtIElmIHZhbCBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAsIHNldCB0byBkZWZhdWx0IHZhbHVlLlxuICAgICAgLy8gLSBJZiB2YWwgaXMgYSBgQ29tcHV0ZWQgUHJvcGVydHlgLCBnZXQgaXRzIGN1cnJlbnQgY2FjaGUgb2JqZWN0LlxuICAgICAgLy8gLSBJZiB2YWwgaXMgYG51bGxgLCBzZXQgdG8gZGVmYXVsdCB2YWx1ZSBvciAoZmFsbGJhY2sgYHVuZGVmaW5lZGApLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgZnVuY3Rpb24gaXMgdGhlIHNhbWUgYXMgdGhlIGN1cnJlbnQgY29tcHV0ZWQgcHJvcGVydHksIGNvbnRpbnVlLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgdmFsdWUgaXMgYSBgRnVuY3Rpb25gLCB0dXJuIGl0IGludG8gYSBgQ29tcHV0ZWQgUHJvcGVydHlgLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgaXMgZ29pbmcgdG8gYmUgYSBjeWNsaWNhbCBkZXBlbmRhbmN5LCB1c2UgdGhlIG9yaWdpbmFsIG9iamVjdCwgZG9uJ3QgbWFrZSBhIGNvcHkuXG4gICAgICAvLyAtIEVsc2UgSWYgdXBkYXRpbmcgYW4gZXhpc3Rpbmcgb2JqZWN0IHdpdGggaXRzIHJlc3BlY3RpdmUgZGF0YSB0eXBlLCBsZXQgQmFja2JvbmUgaGFuZGxlIHRoZSBtZXJnZS5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGEgYE1vZGVsYCBvciBgQ29sbGVjdGlvbmAsIGNyZWF0ZSBhIG5ldyBjb3B5IG9mIGl0IHVzaW5nIGl0cyBjb25zdHJ1Y3RvciwgcHJlc2VydmluZyBpdHMgZGVmYXVsdHMgd2hpbGUgZW5zdXJpbmcgbm8gc2hhcmVkIG1lbW9yeSBiZXR3ZWVuIG9iamVjdHMuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyB2YWx1ZSBpcyBhbiBgQXJyYXlgLCB0dXJuIGl0IGludG8gYSBgQ29sbGVjdGlvbmAuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyB2YWx1ZSBpcyBhIGBPYmplY3RgLCB0dXJuIGl0IGludG8gYSBgTW9kZWxgLlxuICAgICAgLy8gLSBFbHNlIHZhbCBpcyBhIHByaW1pdGl2ZSB2YWx1ZSwgc2V0IGl0IGFjY29yZGluZ2x5LlxuXG5cblxuICAgICAgaWYoXy5pc051bGwodmFsKSB8fCBfLmlzVW5kZWZpbmVkKHZhbCkpIHZhbCA9IHRoaXMuZGVmYXVsdHNba2V5XTtcbiAgICAgIGlmKHZhbCAmJiB2YWwuaXNDb21wdXRlZFByb3BlcnR5KSB2YWwgPSB2YWwudmFsdWUoKTtcbiAgICAgIGVsc2UgaWYoXy5pc051bGwodmFsKSB8fCBfLmlzVW5kZWZpbmVkKHZhbCkpIHZhbCA9IHVuZGVmaW5lZDtcbiAgICAgIGVsc2UgaWYoZGVzdGluYXRpb24uaXNDb21wdXRlZFByb3BlcnR5ICYmIGRlc3RpbmF0aW9uLmZ1bmMgPT09IHZhbCkgY29udGludWU7XG4gICAgICBlbHNlIGlmKF8uaXNGdW5jdGlvbih2YWwpKSB2YWwgPSBuZXcgQ29tcHV0ZWRQcm9wZXJ0eSh2YWwsIGxpbmVhZ2UpO1xuICAgICAgZWxzZSBpZih2YWwuaXNEYXRhICYmIHRhcmdldC5oYXNQYXJlbnQodmFsKSkgdmFsID0gdmFsO1xuICAgICAgZWxzZSBpZiggZGVzdGluYXRpb24uaXNDb21wdXRlZFByb3BlcnR5IHx8XG4gICAgICAgICAgICAgICggZGVzdGluYXRpb24uaXNDb2xsZWN0aW9uICYmICggXy5pc0FycmF5KHZhbCkgfHwgdmFsLmlzQ29sbGVjdGlvbiApKSB8fFxuICAgICAgICAgICAgICAoIGRlc3RpbmF0aW9uLmlzTW9kZWwgJiYgKCBfLmlzT2JqZWN0KHZhbCkgfHwgdmFsLmlzTW9kZWwgKSkpe1xuICAgICAgICBkZXN0aW5hdGlvbi5zZXQodmFsLCBvcHRpb25zKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHZhbC5pc0RhdGEgJiYgb3B0aW9ucy5jbG9uZSAhPT0gZmFsc2UpIHZhbCA9IG5ldyB2YWwuY29uc3RydWN0b3IodmFsLmF0dHJpYnV0ZXMgfHwgdmFsLm1vZGVscywgbGluZWFnZSk7XG4gICAgICBlbHNlIGlmKF8uaXNBcnJheSh2YWwpKSB2YWwgPSBuZXcgUmVib3VuZC5Db2xsZWN0aW9uKHZhbCwgbGluZWFnZSk7IC8vIFRPRE86IFJlbW92ZSBnbG9iYWwgcmVmZXJhbmNlXG4gICAgICBlbHNlIGlmKF8uaXNPYmplY3QodmFsKSkgdmFsID0gbmV3IE1vZGVsKHZhbCwgbGluZWFnZSk7XG5cbiAgICAgIC8vIElmIHZhbCBpcyBhIGRhdGEgb2JqZWN0LCBsZXQgdGhpcyBvYmplY3Qga25vdyBpdCBpcyBub3cgYSBwYXJlbnRcbiAgICAgIHRoaXMuX2hhc0FuY2VzdHJ5ID0gKHZhbCAmJiB2YWwuaXNEYXRhIHx8IGZhbHNlKTtcblxuICAgICAgLy8gU2V0IHRoZSB2YWx1ZVxuICAgICAgQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnNldC5jYWxsKHRhcmdldCwgYXR0ciwgdmFsLCBvcHRpb25zKTsgLy8gVE9ETzogRXZlbnQgY2xlYW51cCB3aGVuIHJlcGxhY2luZyBhIG1vZGVsIG9yIGNvbGxlY3Rpb24gd2l0aCBhbm90aGVyIHZhbHVlXG5cbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfSxcblxuICAvLyBSZWN1cnNpdmUgYHRvSlNPTmAgZnVuY3Rpb24gdHJhdmVyc2VzIHRoZSBkYXRhIHRyZWUgcmV0dXJuaW5nIGEgSlNPTiBvYmplY3QuXG4gIC8vIElmIHRoZXJlIGFyZSBhbnkgY3ljbGljIGRlcGVuZGFuY2llcyB0aGUgb2JqZWN0J3MgYGNpZGAgaXMgdXNlZCBpbnN0ZWFkIG9mIGxvb3BpbmcgaW5maW5pdGVseS5cbiAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLl9pc1NlcmlhbGl6aW5nKSByZXR1cm4gdGhpcy5pZCB8fCB0aGlzLmNpZDtcbiAgICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSB0cnVlO1xuICAgICAgdmFyIGpzb24gPSBfLmNsb25lKHRoaXMuYXR0cmlidXRlcyk7XG4gICAgICBfLmVhY2goanNvbiwgZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICBpZiggXy5pc051bGwodmFsdWUpIHx8IF8uaXNVbmRlZmluZWQodmFsdWUpICl7IHJldHVybjsgfVxuICAgICAgICAgIF8uaXNGdW5jdGlvbih2YWx1ZS50b0pTT04pICYmIChqc29uW25hbWVdID0gdmFsdWUudG9KU09OKCkpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9pc1NlcmlhbGl6aW5nID0gZmFsc2U7XG4gICAgICByZXR1cm4ganNvbjtcbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgTW9kZWw7XG4iLCIvLyBSZWJvdW5kIExhenkgVmFsdWVcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxudmFyIE5JTCA9IGZ1bmN0aW9uIE5JTCgpe30sXG4gICAgRU1QVFlfQVJSQVkgPSBbXTtcblxuZnVuY3Rpb24gTGF6eVZhbHVlKGZuLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSlcbiAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdsYXp5VmFsdWUnKTtcbiAgdGhpcy52YWx1ZUZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCBudWxsO1xuICB0aGlzLm1vcnBoID0gb3B0aW9ucy5tb3JwaCB8fCBudWxsO1xuICB0aGlzLmF0dHJNb3JwaCA9IG9wdGlvbnMuYXR0ck1vcnBoIHx8IG51bGw7XG4gIF8uYmluZEFsbCh0aGlzLCAndmFsdWUnLCAnc2V0JywgJ2FkZERlcGVuZGVudFZhbHVlJywgJ2FkZE9ic2VydmVyJywgJ25vdGlmeScsICdvbk5vdGlmeScsICdkZXN0cm95Jyk7XG59XG5cbkxhenlWYWx1ZS5wcm90b3R5cGUgPSB7XG4gIGlzTGF6eVZhbHVlOiB0cnVlLFxuICBwYXJlbnQ6IG51bGwsIC8vIFRPRE86IGlzIHBhcmVudCBldmVuIG5lZWRlZD8gY291bGQgYmUgbW9kZWxlZCBhcyBhIHN1YnNjcmliZXJcbiAgY2hpbGRyZW46IG51bGwsXG4gIG9ic2VydmVyczogbnVsbCxcbiAgY2FjaGU6IE5JTCxcbiAgdmFsdWVGbjogbnVsbCxcbiAgc3Vic2NyaWJlcnM6IG51bGwsIC8vIFRPRE86IGRvIHdlIG5lZWQgbXVsdGlwbGUgc3Vic2NyaWJlcnM/XG4gIF9jaGlsZFZhbHVlczogbnVsbCwgLy8ganVzdCBmb3IgcmV1c2luZyB0aGUgYXJyYXksIG1pZ2h0IG5vdCB3b3JrIHdlbGwgaWYgY2hpbGRyZW4ubGVuZ3RoIGNoYW5nZXMgYWZ0ZXIgY29tcHV0YXRpb25cblxuICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZTtcbiAgICBpZiAoY2FjaGUgIT09IE5JTCkgeyByZXR1cm4gY2FjaGU7IH1cblxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICB2YXIgY2hpbGQsXG4gICAgICAgICAgdmFsdWVzID0gdGhpcy5fY2hpbGRWYWx1ZXMgfHwgbmV3IEFycmF5KGNoaWxkcmVuLmxlbmd0aCk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgIHZhbHVlc1tpXSA9IChjaGlsZCAmJiBjaGlsZC5pc0xhenlWYWx1ZSkgPyBjaGlsZC52YWx1ZSgpIDogY2hpbGQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmNhY2hlID0gdGhpcy52YWx1ZUZuKHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmNhY2hlID0gdGhpcy52YWx1ZUZuKEVNUFRZX0FSUkFZKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlLCBvcHRpb25zKXtcbiAgICBpZih0aGlzLmNvbnRleHQpe1xuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5zZXQoa2V5LCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9LFxuXG4gIGFkZERlcGVuZGVudFZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgaWYgKCFjaGlsZHJlbikge1xuICAgICAgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuID0gW3ZhbHVlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2hpbGRyZW4ucHVzaCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlICYmIHZhbHVlLmlzTGF6eVZhbHVlKSB7IHZhbHVlLnBhcmVudCA9IHRoaXM7IH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGFkZE9ic2VydmVyOiBmdW5jdGlvbihwYXRoLCBjb250ZXh0KSB7XG4gICAgdmFyIG9ic2VydmVycyA9IHRoaXMub2JzZXJ2ZXJzIHx8ICh0aGlzLm9ic2VydmVycyA9IFtdKSxcbiAgICAgICAgcG9zaXRpb24sIHJlcztcblxuICAgIGlmKCFfLmlzT2JqZWN0KGNvbnRleHQpIHx8ICFfLmlzU3RyaW5nKHBhdGgpKSByZXR1cm4gY29uc29sZS5lcnJvcignRXJyb3IgYWRkaW5nIG9ic2VydmVyIGZvcicsIGNvbnRleHQsIHBhdGgpO1xuXG4gICAgLy8gRW5zdXJlIF9vYnNlcnZlcnMgZXhpc3RzIGFuZCBpcyBhbiBvYmplY3RcbiAgICBjb250ZXh0Ll9fb2JzZXJ2ZXJzID0gY29udGV4dC5fX29ic2VydmVycyB8fCB7fTtcbiAgICAvLyBFbnN1cmUgX19vYnNlcnZlcnNbcGF0aF0gZXhpc3RzIGFuZCBpcyBhbiBhcnJheVxuICAgIGNvbnRleHQuX19vYnNlcnZlcnNbcGF0aF0gPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzW3BhdGhdIHx8IHtjb2xsZWN0aW9uOiBbXSwgbW9kZWw6IFtdfTtcblxuICAgIC8vIFNhdmUgdGhlIHR5cGUgb2Ygb2JqZWN0IGV2ZW50cyB0aGlzIG9ic2VydmVyIGlzIGZvclxuICAgIHJlcyA9IGNvbnRleHQuZ2V0KHRoaXMucGF0aCk7XG4gICAgcmVzID0gKHJlcyAmJiByZXMuaXNDb2xsZWN0aW9uKSA/ICdjb2xsZWN0aW9uJyA6ICdtb2RlbCc7XG5cbiAgICAvLyBBZGQgb3VyIGNhbGxiYWNrLCBzYXZlIHRoZSBwb3NpdGlvbiBpdCBpcyBiZWluZyBpbnNlcnRlZCBzbyB3ZSBjYW4gZ2FyYmFnZSBjb2xsZWN0IGxhdGVyLlxuICAgIHBvc2l0aW9uID0gY29udGV4dC5fX29ic2VydmVyc1twYXRoXVtyZXNdLnB1c2godGhpcykgLSAxO1xuXG4gICAgLy8gTGF6eXZhbHVlIG5lZWRzIHJlZmVyYW5jZSB0byBpdHMgb2JzZXJ2ZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgb24gZGVzdHJveVxuICAgIG9ic2VydmVycy5wdXNoKHtjb250ZXh0OiBjb250ZXh0LCBwYXRoOiBwYXRoLCBpbmRleDogcG9zaXRpb259KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG5vdGlmeTogZnVuY3Rpb24oc2VuZGVyKSB7XG4gICAgLy8gVE9ETzogVGhpcyBjaGVjayB3b24ndCBiZSBuZWNlc3Nhcnkgb25jZSByZW1vdmVkIERPTSBoYXMgYmVlbiBjbGVhbmVkIG9mIGFueSBiaW5kaW5ncy5cbiAgICAvLyBJZiB0aGlzIGxhenlWYWx1ZSdzIG1vcnBoIGRvZXMgbm90IGhhdmUgYW4gaW1tZWRpYXRlIHBhcmVudE5vZGUsIGl0IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgZG9tIHRyZWUuIERlc3Ryb3kgaXQuXG4gICAgLy8gUmlnaHQgbm93LCBET00gdGhhdCBjb250YWlucyBtb3JwaHMgdGhyb3cgYW4gZXJyb3IgaWYgaXQgaXMgcmVtb3ZlZCBieSBhbm90aGVyIGxhenl2YWx1ZSBiZWZvcmUgdGhvc2UgbW9ycGhzIHJlLWV2YWx1YXRlLlxuICAgIGlmKHRoaXMubW9ycGggJiYgdGhpcy5tb3JwaC5maXJzdE5vZGUgJiYgIXRoaXMubW9ycGguZmlyc3ROb2RlLnBhcmVudE5vZGUpIHJldHVybiB0aGlzLmRlc3Ryb3koKTtcbiAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlLFxuICAgICAgICBwYXJlbnQsXG4gICAgICAgIHN1YnNjcmliZXJzO1xuXG4gICAgaWYgKGNhY2hlICE9PSBOSUwpIHtcbiAgICAgIHBhcmVudCA9IHRoaXMucGFyZW50O1xuICAgICAgc3Vic2NyaWJlcnMgPSB0aGlzLnN1YnNjcmliZXJzO1xuICAgICAgY2FjaGUgPSB0aGlzLmNhY2hlID0gTklMO1xuICAgICAgaWYgKHBhcmVudCkgeyBwYXJlbnQubm90aWZ5KHRoaXMpOyB9XG4gICAgICBpZiAoIXN1YnNjcmliZXJzKSB7IHJldHVybjsgfVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzdWJzY3JpYmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgc3Vic2NyaWJlcnNbaV0odGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIG9uTm90aWZ5OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciBzdWJzY3JpYmVycyA9IHRoaXMuc3Vic2NyaWJlcnMgfHwgKHRoaXMuc3Vic2NyaWJlcnMgPSBbXSk7XG4gICAgc3Vic2NyaWJlcnMucHVzaChjYWxsYmFjayk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKXtcbiAgICAgIGlmIChjaGlsZCAmJiBjaGlsZC5pc0xhenlWYWx1ZSl7IGNoaWxkLmRlc3Ryb3koKTsgfVxuICAgIH0pO1xuICAgIF8uZWFjaCh0aGlzLnN1YnNjcmliZXJzLCBmdW5jdGlvbihzdWJzY3JpYmVyKXtcbiAgICAgIGlmIChzdWJzY3JpYmVyICYmIHN1YnNjcmliZXIuaXNMYXp5VmFsdWUpeyBzdWJzY3JpYmVyLmRlc3Ryb3koKTsgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wYXJlbnQgPSB0aGlzLmNoaWxkcmVuID0gdGhpcy5jYWNoZSA9IHRoaXMudmFsdWVGbiA9IHRoaXMuc3Vic2NyaWJlcnMgPSB0aGlzLl9jaGlsZFZhbHVlcyA9IG51bGw7XG5cbiAgICBfLmVhY2godGhpcy5vYnNlcnZlcnMsIGZ1bmN0aW9uKG9ic2VydmVyKXtcbiAgICAgIGlmKF8uaXNPYmplY3Qob2JzZXJ2ZXIuY29udGV4dC5fX29ic2VydmVyc1tvYnNlcnZlci5wYXRoXSkpe1xuICAgICAgICBkZWxldGUgb2JzZXJ2ZXIuY29udGV4dC5fX29ic2VydmVyc1tvYnNlcnZlci5wYXRoXVtvYnNlcnZlci5pbmRleF07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLm9ic2VydmVycyA9IG51bGw7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IExhenlWYWx1ZTtcbiIsIi8vIFJlYm91bmQgRGF0YVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuLy8gVGhlc2UgYXJlIG1ldGhvZHMgaW5oZXJpdGVkIGJ5IGFsbCBSZWJvdW5kIGRhdGEgdHlwZXMg4oCTICoqTW9kZWxzKiosXG4vLyAqKkNvbGxlY3Rpb25zKiogYW5kICoqQ29tcHV0ZWQgUHJvcGVydGllcyoqIOKAkyBhbmQgY29udHJvbCB0cmVlIGFuY2VzdHJ5XG4vLyB0cmFja2luZywgZGVlcCBldmVudCBwcm9wYWdhdGlvbiBhbmQgdHJlZSBkZXN0cnVjdGlvbi5cblxuaW1wb3J0IE1vZGVsIGZyb20gXCJyZWJvdW5kLWRhdGEvbW9kZWxcIjtcbmltcG9ydCBDb2xsZWN0aW9uIGZyb20gXCJyZWJvdW5kLWRhdGEvY29sbGVjdGlvblwiO1xuaW1wb3J0IENvbXB1dGVkUHJvcGVydHkgZnJvbSBcInJlYm91bmQtZGF0YS9jb21wdXRlZC1wcm9wZXJ0eVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbnZhciBzaGFyZWRNZXRob2RzID0ge1xuICAvLyBXaGVuIGEgY2hhbmdlIGV2ZW50IHByb3BhZ2F0ZXMgdXAgdGhlIHRyZWUgaXQgbW9kaWZpZXMgdGhlIHBhdGggcGFydCBvZlxuICAvLyBgY2hhbmdlOjxwYXRoPmAgdG8gcmVmbGVjdCB0aGUgZnVsbHkgcXVhbGlmaWVkIHBhdGggcmVsYXRpdmUgdG8gdGhhdCBvYmplY3QuXG4gIC8vIEV4OiBXb3VsZCB0cmlnZ2VyIGBjaGFuZ2U6dmFsYCwgYGNoYW5nZTpbMF0udmFsYCwgYGNoYW5nZTphcnJbMF0udmFsYCBhbmQgYG9iai5hcnJbMF0udmFsYFxuICAvLyBvbiBlYWNoIHBhcmVudCBhcyBpdCBpcyBwcm9wYWdhdGVkIHVwIHRoZSB0cmVlLlxuICBwcm9wYWdhdGVFdmVudDogZnVuY3Rpb24odHlwZSwgbW9kZWwpe1xuICAgIGlmKHRoaXMuX19wYXJlbnRfXyA9PT0gdGhpcyB8fCB0eXBlID09PSAnZGlydHknKSByZXR1cm47XG4gICAgaWYodHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgPT09IDAgJiYgbW9kZWwuaXNNb2RlbCl7XG4gICAgICBpZih0aGlzLmlzQ29sbGVjdGlvbiAmJiB+dHlwZS5pbmRleE9mKCdjaGFuZ2U6WycpKSByZXR1cm47XG4gICAgICB2YXIga2V5LFxuICAgICAgICAgIHBhdGggPSBtb2RlbC5fX3BhdGgoKS5yZXBsYWNlKHRoaXMuX19wYXJlbnRfXy5fX3BhdGgoKSwgJycpLnJlcGxhY2UoL15cXC4vLCAnJyksXG4gICAgICAgICAgY2hhbmdlZCA9IG1vZGVsLmNoYW5nZWRBdHRyaWJ1dGVzKCk7XG5cbiAgICAgIGZvcihrZXkgaW4gY2hhbmdlZCl7XG4gICAgICAgIGFyZ3VtZW50c1swXSA9ICgnY2hhbmdlOicgKyBwYXRoICsgKHBhdGggJiYgJy4nKSArIGtleSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICB0aGlzLl9fcGFyZW50X18udHJpZ2dlci5hcHBseSh0aGlzLl9fcGFyZW50X18sIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9fcGFyZW50X18udHJpZ2dlci5hcHBseSh0aGlzLl9fcGFyZW50X18sIGFyZ3VtZW50cyk7XG4gIH0sXG5cbiAgLy8gU2V0IHRoaXMgZGF0YSBvYmplY3QncyBwYXJlbnQgdG8gYHBhcmVudGAgYW5kLCBhcyBsb25nIGFzIGEgZGF0YSBvYmplY3QgaXNcbiAgLy8gbm90IGl0cyBvd24gcGFyZW50LCBwcm9wYWdhdGUgZXZlcnkgZXZlbnQgdHJpZ2dlcmVkIG9uIGB0aGlzYCB1cCB0aGUgdHJlZS5cbiAgc2V0UGFyZW50OiBmdW5jdGlvbihwYXJlbnQpe1xuICAgIGlmKHRoaXMuX19wYXJlbnRfXykgdGhpcy5vZmYoJ2FsbCcsIHRoaXMucHJvcGFnYXRlRXZlbnQpO1xuICAgIHRoaXMuX19wYXJlbnRfXyA9IHBhcmVudDtcbiAgICB0aGlzLl9oYXNBbmNlc3RyeSA9IHRydWU7XG4gICAgaWYocGFyZW50ICE9PSB0aGlzKSB0aGlzLm9uKCdhbGwnLCB0aGlzLl9fcGFyZW50X18ucHJvcGFnYXRlRXZlbnQpO1xuICAgIHJldHVybiBwYXJlbnQ7XG4gIH0sXG5cbiAgLy8gUmVjdXJzaXZlbHkgc2V0IGEgZGF0YSB0cmVlJ3Mgcm9vdCBlbGVtZW50IHN0YXJ0aW5nIHdpdGggYHRoaXNgIHRvIHRoZSBkZWVwZXN0IGNoaWxkLlxuICAvLyBUT0RPOiBJIGRvbnQgbGlrZSB0aGlzIHJlY3Vyc2l2ZWx5IHNldHRpbmcgZWxlbWVudHMgcm9vdCB3aGVuIG9uZSBlbGVtZW50J3Mgcm9vdCBjaGFuZ2VzLiBGaXggdGhpcy5cbiAgc2V0Um9vdDogZnVuY3Rpb24gKHJvb3Qpe1xuICAgIHZhciBvYmogPSB0aGlzO1xuICAgIG9iai5fX3Jvb3RfXyA9IHJvb3Q7XG4gICAgdmFyIHZhbCA9IG9iai5tb2RlbHMgfHwgIG9iai5hdHRyaWJ1dGVzIHx8IG9iai5jYWNoZTtcbiAgICBfLmVhY2godmFsLCBmdW5jdGlvbih2YWx1ZSwga2V5KXtcbiAgICAgIGlmKHZhbHVlICYmIHZhbHVlLmlzRGF0YSl7XG4gICAgICAgIHZhbHVlLnNldFJvb3Qocm9vdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJvb3Q7XG4gIH0sXG5cbiAgLy8gVGVzdHMgdG8gc2VlIGlmIGB0aGlzYCBoYXMgYSBwYXJlbnQgYG9iamAuXG4gIGhhc1BhcmVudDogZnVuY3Rpb24ob2JqKXtcbiAgICB2YXIgdG1wID0gdGhpcztcbiAgICB3aGlsZSh0bXAgIT09IG9iail7XG4gICAgICB0bXAgPSB0bXAuX19wYXJlbnRfXztcbiAgICAgIGlmKF8uaXNVbmRlZmluZWQodG1wKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYodG1wID09PSBvYmopIHJldHVybiB0cnVlO1xuICAgICAgaWYodG1wLl9fcGFyZW50X18gPT09IHRtcCkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcblxuICAvLyBEZS1pbml0aWFsaXplcyBhIGRhdGEgdHJlZSBzdGFydGluZyB3aXRoIGB0aGlzYCBhbmQgcmVjdXJzaXZlbHkgY2FsbGluZyBgZGVpbml0aWFsaXplKClgIG9uIGVhY2ggY2hpbGQuXG4gIGRlaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xuXG4gIC8vIFVuZGVsZWdhdGUgQmFja2JvbmUgRXZlbnRzIGZyb20gdGhpcyBkYXRhIG9iamVjdFxuICAgIGlmICh0aGlzLnVuZGVsZWdhdGVFdmVudHMpIHRoaXMudW5kZWxlZ2F0ZUV2ZW50cygpO1xuICAgIGlmICh0aGlzLnN0b3BMaXN0ZW5pbmcpIHRoaXMuc3RvcExpc3RlbmluZygpO1xuICAgIGlmICh0aGlzLm9mZikgdGhpcy5vZmYoKTtcblxuICAvLyBEZXN0cm95IHRoaXMgZGF0YSBvYmplY3QncyBsaW5lYWdlXG4gICAgZGVsZXRlIHRoaXMuX19wYXJlbnRfXztcbiAgICBkZWxldGUgdGhpcy5fX3Jvb3RfXztcbiAgICBkZWxldGUgdGhpcy5fX3BhdGg7XG5cbiAgLy8gSWYgdGhlcmUgaXMgYSBkb20gZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhpcyBkYXRhIG9iamVjdCwgZGVzdHJveSBhbGwgbGlzdGVuZXJzIGFzc29jaWF0ZWQgd2l0aCBpdC5cbiAgLy8gUmVtb3ZlIGFsbCBldmVudCBsaXN0ZW5lcnMgZnJvbSB0aGlzIGRvbSBlbGVtZW50LCByZWN1cnNpdmVseSByZW1vdmUgZWxlbWVudCBsYXp5dmFsdWVzLFxuICAvLyBhbmQgdGhlbiByZW1vdmUgdGhlIGVsZW1lbnQgcmVmZXJhbmNlIGl0c2VsZi5cbiAgICBpZih0aGlzLmVsKXtcbiAgICAgIF8uZWFjaCh0aGlzLmVsLl9fbGlzdGVuZXJzLCBmdW5jdGlvbihoYW5kbGVyLCBldmVudFR5cGUpe1xuICAgICAgICBpZiAodGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKSB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIGlmICh0aGlzLmVsLmRldGFjaEV2ZW50KSB0aGlzLmVsLmRldGFjaEV2ZW50KCdvbicrZXZlbnRUeXBlLCBoYW5kbGVyKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgICAgJCh0aGlzLmVsKS53YWxrVGhlRE9NKGZ1bmN0aW9uKGVsKXtcbiAgICAgICAgaWYoZWwuX19sYXp5VmFsdWUgJiYgZWwuX19sYXp5VmFsdWUuZGVzdHJveSgpKSBuLl9fbGF6eVZhbHVlLmRlc3Ryb3koKTtcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHRoaXMuZWwuX19saXN0ZW5lcnM7XG4gICAgICBkZWxldGUgdGhpcy5lbC5fX2V2ZW50cztcbiAgICAgIGRlbGV0ZSB0aGlzLiRlbDtcbiAgICAgIGRlbGV0ZSB0aGlzLmVsO1xuICAgIH1cblxuICAvLyBDbGVhbiB1cCBIb29rIGNhbGxiYWNrIHJlZmVyZW5jZXNcbiAgICBkZWxldGUgdGhpcy5fX29ic2VydmVycztcblxuICAvLyBNYXJrIGFzIGRlaW5pdGlhbGl6ZWQgc28gd2UgZG9uJ3QgbG9vcCBvbiBjeWNsaWMgZGVwZW5kYW5jaWVzLlxuICAgIHRoaXMuZGVpbml0aWFsaXplZCA9IHRydWU7XG5cbiAgLy8gRGVzdHJveSBhbGwgY2hpbGRyZW4gb2YgdGhpcyBkYXRhIG9iamVjdC5cbiAgLy8gSWYgYSBDb2xsZWN0aW9uLCBkZS1pbml0IGFsbCBvZiBpdHMgTW9kZWxzLCBpZiBhIE1vZGVsLCBkZS1pbml0IGFsbCBvZiBpdHNcbiAgLy8gQXR0cmlidXRlcywgaWYgYSBDb21wdXRlZCBQcm9wZXJ0eSwgZGUtaW5pdCBpdHMgQ2FjaGUgb2JqZWN0cy5cbiAgICBfLmVhY2godGhpcy5tb2RlbHMsIGZ1bmN0aW9uICh2YWwpIHsgdmFsICYmIHZhbC5kZWluaXRpYWxpemUgJiYgdmFsLmRlaW5pdGlhbGl6ZSgpOyB9KTtcbiAgICBfLmVhY2godGhpcy5hdHRyaWJ1dGVzLCBmdW5jdGlvbiAodmFsKSB7IHZhbCAmJiB2YWwuZGVpbml0aWFsaXplICYmIHZhbC5kZWluaXRpYWxpemUoKTt9KTtcbiAgICB0aGlzLmNhY2hlICYmIHRoaXMuY2FjaGUuY29sbGVjdGlvbi5kZWluaXRpYWxpemUoKTtcbiAgICB0aGlzLmNhY2hlICYmIHRoaXMuY2FjaGUubW9kZWwuZGVpbml0aWFsaXplKCk7XG5cbiAgfVxufTtcblxuLy8gRXh0ZW5kIGFsbCBvZiB0aGUgKipSZWJvdW5kIERhdGEqKiBwcm90b3R5cGVzIHdpdGggdGhlc2Ugc2hhcmVkIG1ldGhvZHNcbl8uZXh0ZW5kKE1vZGVsLnByb3RvdHlwZSwgc2hhcmVkTWV0aG9kcyk7XG5fLmV4dGVuZChDb2xsZWN0aW9uLnByb3RvdHlwZSwgc2hhcmVkTWV0aG9kcyk7XG5fLmV4dGVuZChDb21wdXRlZFByb3BlcnR5LnByb3RvdHlwZSwgc2hhcmVkTWV0aG9kcyk7XG5cbmV4cG9ydCB7IE1vZGVsLCBDb2xsZWN0aW9uLCBDb21wdXRlZFByb3BlcnR5IH07XG4iLCIvLyBSZWJvdW5kIFV0aWxzXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbnZhciAkID0gZnVuY3Rpb24ocXVlcnkpe1xuICByZXR1cm4gbmV3IHV0aWxzKHF1ZXJ5KTtcbn07XG5cbnZhciB1dGlscyA9IGZ1bmN0aW9uKHF1ZXJ5KXtcbiAgdmFyIGksIHNlbGVjdG9yID0gXy5pc0VsZW1lbnQocXVlcnkpICYmIFtxdWVyeV0gfHwgKHF1ZXJ5ID09PSBkb2N1bWVudCkgJiYgW2RvY3VtZW50XSB8fCBfLmlzU3RyaW5nKHF1ZXJ5KSAmJiBxdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSB8fCBbXTtcbiAgdGhpcy5sZW5ndGggPSBzZWxlY3Rvci5sZW5ndGg7XG5cbiAgLy8gQWRkIHNlbGVjdG9yIHRvIG9iamVjdCBmb3IgbWV0aG9kIGNoYWluaW5nXG4gIGZvciAoaT0wOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHNlbGVjdG9yW2ldO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiByZXR1cm5GYWxzZSgpe3JldHVybiBmYWxzZTt9XG5mdW5jdGlvbiByZXR1cm5UcnVlKCl7cmV0dXJuIHRydWU7fVxuXG4kLkV2ZW50ID0gZnVuY3Rpb24oIHNyYywgcHJvcHMgKSB7XG5cdC8vIEFsbG93IGluc3RhbnRpYXRpb24gd2l0aG91dCB0aGUgJ25ldycga2V5d29yZFxuXHRpZiAoICEodGhpcyBpbnN0YW5jZW9mICQuRXZlbnQpICkge1xuXHRcdHJldHVybiBuZXcgJC5FdmVudCggc3JjLCBwcm9wcyApO1xuXHR9XG5cblx0Ly8gRXZlbnQgb2JqZWN0XG5cdGlmICggc3JjICYmIHNyYy50eXBlICkge1xuXHRcdHRoaXMub3JpZ2luYWxFdmVudCA9IHNyYztcblx0XHR0aGlzLnR5cGUgPSBzcmMudHlwZTtcblxuXHRcdC8vIEV2ZW50cyBidWJibGluZyB1cCB0aGUgZG9jdW1lbnQgbWF5IGhhdmUgYmVlbiBtYXJrZWQgYXMgcHJldmVudGVkXG5cdFx0Ly8gYnkgYSBoYW5kbGVyIGxvd2VyIGRvd24gdGhlIHRyZWU7IHJlZmxlY3QgdGhlIGNvcnJlY3QgdmFsdWUuXG5cdFx0dGhpcy5pc0RlZmF1bHRQcmV2ZW50ZWQgPSBzcmMuZGVmYXVsdFByZXZlbnRlZCB8fFxuXHRcdFx0XHRzcmMuZGVmYXVsdFByZXZlbnRlZCA9PT0gdW5kZWZpbmVkICYmXG5cdFx0XHRcdC8vIFN1cHBvcnQ6IEFuZHJvaWQ8NC4wXG5cdFx0XHRcdHNyYy5yZXR1cm5WYWx1ZSA9PT0gZmFsc2UgP1xuXHRcdFx0cmV0dXJuVHJ1ZSA6XG5cdFx0XHRyZXR1cm5GYWxzZTtcblxuXHQvLyBFdmVudCB0eXBlXG5cdH0gZWxzZSB7XG5cdFx0dGhpcy50eXBlID0gc3JjO1xuXHR9XG5cblx0Ly8gUHV0IGV4cGxpY2l0bHkgcHJvdmlkZWQgcHJvcGVydGllcyBvbnRvIHRoZSBldmVudCBvYmplY3Rcblx0aWYgKCBwcm9wcyApIHtcblx0XHRfLmV4dGVuZCggdGhpcywgcHJvcHMgKTtcblx0fVxuXG4gIC8vIENvcHkgb3ZlciBhbGwgb3JpZ2luYWwgZXZlbnQgcHJvcGVydGllc1xuICBfLmV4dGVuZCh0aGlzLCBfLnBpY2soIHRoaXMub3JpZ2luYWxFdmVudCwgW1xuICAgICAgXCJhbHRLZXlcIiwgXCJidWJibGVzXCIsIFwiY2FuY2VsYWJsZVwiLCBcImN0cmxLZXlcIiwgXCJjdXJyZW50VGFyZ2V0XCIsIFwiZXZlbnRQaGFzZVwiLFxuICAgICAgXCJtZXRhS2V5XCIsIFwicmVsYXRlZFRhcmdldFwiLCBcInNoaWZ0S2V5XCIsIFwidGFyZ2V0XCIsIFwidGltZVN0YW1wXCIsIFwidmlld1wiLFxuICAgICAgXCJ3aGljaFwiLCBcImNoYXJcIiwgXCJjaGFyQ29kZVwiLCBcImtleVwiLCBcImtleUNvZGVcIiwgXCJidXR0b25cIiwgXCJidXR0b25zXCIsXG4gICAgICBcImNsaWVudFhcIiwgXCJjbGllbnRZXCIsIFwiXCIsIFwib2Zmc2V0WFwiLCBcIm9mZnNldFlcIiwgXCJwYWdlWFwiLCBcInBhZ2VZXCIsIFwic2NyZWVuWFwiLFxuICAgICAgXCJzY3JlZW5ZXCIsIFwidG9FbGVtZW50XCJcbiAgICBdKSk7XG5cblx0Ly8gQ3JlYXRlIGEgdGltZXN0YW1wIGlmIGluY29taW5nIGV2ZW50IGRvZXNuJ3QgaGF2ZSBvbmVcblx0dGhpcy50aW1lU3RhbXAgPSBzcmMgJiYgc3JjLnRpbWVTdGFtcCB8fCAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG5cdC8vIE1hcmsgaXQgYXMgZml4ZWRcblx0dGhpcy5pc0V2ZW50ID0gdHJ1ZTtcbn07XG5cbiQuRXZlbnQucHJvdG90eXBlID0ge1xuXHRjb25zdHJ1Y3RvcjogJC5FdmVudCxcblx0aXNEZWZhdWx0UHJldmVudGVkOiByZXR1cm5GYWxzZSxcblx0aXNQcm9wYWdhdGlvblN0b3BwZWQ6IHJldHVybkZhbHNlLFxuXHRpc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZDogcmV0dXJuRmFsc2UsXG5cblx0cHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuXG5cdFx0dGhpcy5pc0RlZmF1bHRQcmV2ZW50ZWQgPSByZXR1cm5UcnVlO1xuXG5cdFx0aWYgKCBlICYmIGUucHJldmVudERlZmF1bHQgKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHR9LFxuXHRzdG9wUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuXG5cdFx0dGhpcy5pc1Byb3BhZ2F0aW9uU3RvcHBlZCA9IHJldHVyblRydWU7XG5cblx0XHRpZiAoIGUgJiYgZS5zdG9wUHJvcGFnYXRpb24gKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH1cblx0fSxcblx0c3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcblxuXHRcdHRoaXMuaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSByZXR1cm5UcnVlO1xuXG5cdFx0aWYgKCBlICYmIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICkge1xuXHRcdFx0ZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cblx0XHR0aGlzLnN0b3BQcm9wYWdhdGlvbigpO1xuXHR9XG59O1xuXG5cbnV0aWxzLnByb3RvdHlwZSA9IHtcblxuICAvLyBHaXZlbiBhIHZhbGlkIGRhdGEgcGF0aCwgc3BsaXQgaXQgaW50byBhbiBhcnJheSBvZiBpdHMgcGFydHMuXG4gIC8vIGV4OiBmb28uYmFyWzBdLmJheiAtLT4gWydmb28nLCAndmFyJywgJzAnLCAnYmF6J11cbiAgc3BsaXRQYXRoOiBmdW5jdGlvbihwYXRoKXtcbiAgICBwYXRoID0gKCcuJytwYXRoKycuJykuc3BsaXQoLyg/OlxcLnxcXFt8XFxdKSsvKTtcbiAgICBwYXRoLnBvcCgpO1xuICAgIHBhdGguc2hpZnQoKTtcbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcblxuICAvLyBBcHBsaWVzIGZ1bmN0aW9uIGBmdW5jYCBkZXB0aCBmaXJzdCB0byBldmVyeSBub2RlIGluIHRoZSBzdWJ0cmVlIHN0YXJ0aW5nIGZyb20gYHJvb3RgXG4gIHdhbGtUaGVET006IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgZWwsIHJvb3QsIGxlbiA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlKGxlbi0tKXtcbiAgICAgIHJvb3QgPSB0aGlzW2xlbl07XG4gICAgICBmdW5jKHJvb3QpO1xuICAgICAgcm9vdCA9IHJvb3QuZmlyc3RDaGlsZDtcbiAgICAgIHdoaWxlIChyb290KSB7XG4gICAgICAgICAgJChyb290KS53YWxrVGhlRE9NKGZ1bmMpO1xuICAgICAgICAgIHJvb3QgPSByb290Lm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyBFdmVudHMgcmVnaXN0cnkuIEFuIG9iamVjdCBjb250YWluaW5nIGFsbCBldmVudHMgYm91bmQgdGhyb3VnaCB0aGlzIHV0aWwgc2hhcmVkIGFtb25nIGFsbCBpbnN0YW5jZXMuXG4gIF9ldmVudHM6IHt9LFxuXG4gIC8vIFRha2VzIHRoZSB0YXJnZWQgdGhlIGV2ZW50IGZpcmVkIG9uIGFuZCByZXR1cm5zIGFsbCBjYWxsYmFja3MgZm9yIHRoZSBkZWxlZ2F0ZWQgZWxlbWVudFxuICBfaGFzRGVsZWdhdGU6IGZ1bmN0aW9uKHRhcmdldCwgZGVsZWdhdGUsIGV2ZW50VHlwZSl7XG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4gICAgLy8gR2V0IG91ciBjYWxsYmFja3NcbiAgICBpZih0YXJnZXQuZGVsZWdhdGVHcm91cCAmJiB0aGlzLl9ldmVudHNbdGFyZ2V0LmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV0pe1xuICAgICAgXy5lYWNoKHRoaXMuX2V2ZW50c1t0YXJnZXQuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXSwgZnVuY3Rpb24oY2FsbGJhY2tzTGlzdCwgZGVsZWdhdGVJZCl7XG4gICAgICAgIGlmKF8uaXNBcnJheShjYWxsYmFja3NMaXN0KSAmJiAoZGVsZWdhdGVJZCA9PT0gZGVsZWdhdGUuZGVsZWdhdGVJZCB8fCAoIGRlbGVnYXRlLm1hdGNoZXNTZWxlY3RvciAmJiBkZWxlZ2F0ZS5tYXRjaGVzU2VsZWN0b3IoZGVsZWdhdGVJZCkgKSkgKXtcbiAgICAgICAgICBjYWxsYmFja3MgPSBjYWxsYmFja3MuY29uY2F0KGNhbGxiYWNrc0xpc3QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2FsbGJhY2tzO1xuICB9LFxuXG4gIC8vIFRyaWdnZXJzIGFuIGV2ZW50IG9uIGEgZ2l2ZW4gZG9tIG5vZGVcbiAgdHJpZ2dlcjogZnVuY3Rpb24oZXZlbnROYW1lLCBvcHRpb25zKXtcbiAgICB2YXIgZWwsIGxlbiA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlKGxlbi0tKXtcbiAgICAgIGVsID0gdGhpc1tsZW5dO1xuICAgICAgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50KSB7XG4gICAgICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJyk7XG4gICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgZWwuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5maXJlRXZlbnQoJ29uJytldmVudE5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBvZmY6IGZ1bmN0aW9uKGV2ZW50VHlwZSwgaGFuZGxlcil7XG4gICAgdmFyIGVsLCBsZW4gPSB0aGlzLmxlbmd0aCwgZXZlbnRDb3VudDtcblxuICAgIHdoaWxlKGxlbi0tKXtcblxuICAgICAgZWwgPSB0aGlzW2xlbl07XG4gICAgICBldmVudENvdW50ID0gMDtcblxuICAgICAgaWYoZWwuZGVsZWdhdGVHcm91cCl7XG4gICAgICAgIGlmKHRoaXMuX2V2ZW50c1tlbC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdICYmIF8uaXNBcnJheSh0aGlzLl9ldmVudHNbZWwuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXVtlbC5kZWxlZ2F0ZUlkXSkpe1xuICAgICAgICAgIF8uZWFjaCh0aGlzLl9ldmVudHNbZWwuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXSwgZnVuY3Rpb24oZGVsZWdhdGUsIGluZGV4LCBkZWxlZ2F0ZUxpc3Qpe1xuICAgICAgICAgICAgXy5lYWNoKGRlbGVnYXRlTGlzdCwgZnVuY3Rpb24oY2FsbGJhY2ssIGluZGV4LCBjYWxsYmFja0xpc3Qpe1xuICAgICAgICAgICAgICBpZihjYWxsYmFjayA9PT0gaGFuZGxlcil7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNhbGxiYWNrTGlzdFtpbmRleF07XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGV2ZW50Q291bnQrKztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBtb3JlIG9mIHRoaXMgZXZlbnQgdHlwZSBkZWxlZ2F0ZWQgZm9yIHRoaXMgZ3JvdXAsIHJlbW92ZSB0aGUgbGlzdGVuZXJcbiAgICAgIGlmIChldmVudENvdW50ID09PSAwICYmIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpe1xuICAgICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgaWYgKGV2ZW50Q291bnQgPT09IDAgJiYgZWwuZGV0YWNoRXZlbnQpe1xuICAgICAgICBlbC5kZXRhY2hFdmVudCgnb24nK2V2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICB9XG5cbiAgICB9XG4gIH0sXG5cbiAgb246IGZ1bmN0aW9uIChldmVudE5hbWUsIGRlbGVnYXRlLCBkYXRhLCBoYW5kbGVyKSB7XG4gICAgdmFyIGVsLFxuICAgICAgICBldmVudHMgPSB0aGlzLl9ldmVudHMsXG4gICAgICAgIGxlbiA9IHRoaXMubGVuZ3RoLFxuICAgICAgICBldmVudE5hbWVzID0gZXZlbnROYW1lLnNwbGl0KCcgJyksXG4gICAgICAgIGRlbGVnYXRlSWQsIGRlbGVnYXRlR3JvdXA7XG5cbiAgICB3aGlsZShsZW4tLSl7XG4gICAgICBlbCA9IHRoaXNbbGVuXTtcblxuICAgICAgLy8gTm9ybWFsaXplIGRhdGEgaW5wdXRcbiAgICAgIGlmKF8uaXNGdW5jdGlvbihkZWxlZ2F0ZSkpe1xuICAgICAgICBoYW5kbGVyID0gZGVsZWdhdGU7XG4gICAgICAgIGRlbGVnYXRlID0gZWw7XG4gICAgICAgIGRhdGEgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmKF8uaXNGdW5jdGlvbihkYXRhKSl7XG4gICAgICAgIGhhbmRsZXIgPSBkYXRhO1xuICAgICAgICBkYXRhID0ge307XG4gICAgICB9XG4gICAgICBpZighXy5pc1N0cmluZyhkZWxlZ2F0ZSkgJiYgIV8uaXNFbGVtZW50KGRlbGVnYXRlKSl7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJEZWxlZ2F0ZSB2YWx1ZSBwYXNzZWQgdG8gUmVib3VuZCdzICQub24gaXMgbmVpdGhlciBhbiBlbGVtZW50IG9yIGNzcyBzZWxlY3RvclwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBkZWxlZ2F0ZUlkID0gXy5pc1N0cmluZyhkZWxlZ2F0ZSkgPyBkZWxlZ2F0ZSA6IChkZWxlZ2F0ZS5kZWxlZ2F0ZUlkID0gZGVsZWdhdGUuZGVsZWdhdGVJZCB8fCBfLnVuaXF1ZUlkKCdldmVudCcpKTtcbiAgICAgIGRlbGVnYXRlR3JvdXAgPSBlbC5kZWxlZ2F0ZUdyb3VwID0gKGVsLmRlbGVnYXRlR3JvdXAgfHwgXy51bmlxdWVJZCgnZGVsZWdhdGVHcm91cCcpKTtcblxuICAgICAgXy5lYWNoKGV2ZW50TmFtZXMsIGZ1bmN0aW9uKGV2ZW50TmFtZSl7XG5cbiAgICAgICAgLy8gRW5zdXJlIGV2ZW50IG9iaiBleGlzdGFuY2VcbiAgICAgICAgZXZlbnRzW2RlbGVnYXRlR3JvdXBdID0gZXZlbnRzW2RlbGVnYXRlR3JvdXBdIHx8IHt9O1xuXG4gICAgICAgIC8vIFRPRE86IHRha2Ugb3V0IG9mIGxvb3BcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICB2YXIgdGFyZ2V0LCBpLCBsZW4sIGV2ZW50TGlzdCwgY2FsbGJhY2tzLCBjYWxsYmFjaywgZmFsc3k7XG4gICAgICAgICAgICAgIGV2ZW50ID0gbmV3ICQuRXZlbnQoKGV2ZW50IHx8IHdpbmRvdy5ldmVudCkpOyAvLyBDb252ZXJ0IHRvIG11dGFibGUgZXZlbnRcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgLy8gVHJhdmVsIGZyb20gdGFyZ2V0IHVwIHRvIHBhcmVudCBmaXJpbmcgZXZlbnQgb24gZGVsZWdhdGUgd2hlbiBpdCBleGl6dHNcbiAgICAgICAgICAgICAgd2hpbGUodGFyZ2V0KXtcblxuICAgICAgICAgICAgICAgIC8vIEdldCBhbGwgc3BlY2lmaWVkIGNhbGxiYWNrcyAoZWxlbWVudCBzcGVjaWZpYyBhbmQgc2VsZWN0b3Igc3BlY2lmaWVkKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcyA9ICQuX2hhc0RlbGVnYXRlKGVsLCB0YXJnZXQsIGV2ZW50LnR5cGUpO1xuXG4gICAgICAgICAgICAgICAgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQgPSBldmVudC5zcmNFbGVtZW50ID0gdGFyZ2V0OyAgICAgICAgICAgICAgIC8vIEF0dGFjaCB0aGlzIGxldmVsJ3MgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICBldmVudC5kYXRhID0gY2FsbGJhY2tzW2ldLmRhdGE7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF0dGFjaCBvdXIgZGF0YSB0byB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnJlc3VsdCA9IGNhbGxiYWNrc1tpXS5jYWxsYmFjay5jYWxsKGVsLCBldmVudCk7ICAgLy8gQ2FsbCB0aGUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgIGZhbHN5ID0gKCBldmVudC5yZXN1bHQgPT09IGZhbHNlICkgPyB0cnVlIDogZmFsc3k7ICAgICAgLy8gSWYgYW55IGNhbGxiYWNrIHJldHVybnMgZmFsc2UsIGxvZyBpdCBhcyBmYWxzeVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIGFueSBvZiB0aGUgY2FsbGJhY2tzIHJldHVybmVkIGZhbHNlLCBwcmV2ZW50IGRlZmF1bHQgYW5kIHN0b3AgcHJvcGFnYXRpb25cbiAgICAgICAgICAgICAgICBpZihmYWxzeSl7XG4gICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZXZlbnQgb2YgaXRzIHR5cGUsIGFkZCB0aGUgZXZlbnQgaGFuZGxlclxuICAgICAgICAvLyBBZGRFdmVudExpc3RlbmVyIHN1cHBvcnRzIElFOStcbiAgICAgICAgaWYoIWV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdKXtcbiAgICAgICAgICAvLyBJZiBldmVudCBpcyBmb2N1cyBvciBibHVyLCB1c2UgY2FwdHVyZSB0byBhbGxvdyBmb3IgZXZlbnQgZGVsZWdhdGlvbi5cbiAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2ssIChldmVudE5hbWUgPT09ICdmb2N1cycgfHwgZXZlbnROYW1lID09PSAnYmx1cicpKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gQWRkIG91ciBsaXN0ZW5lclxuICAgICAgICBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXSA9IGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdIHx8IHt9O1xuICAgICAgICBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXVtkZWxlZ2F0ZUlkXSA9IGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdW2RlbGVnYXRlSWRdIHx8IFtdO1xuICAgICAgICBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXVtkZWxlZ2F0ZUlkXS5wdXNoKHtjYWxsYmFjazogaGFuZGxlciwgZGF0YTogZGF0YX0pO1xuXG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gIH0sXG5cbiAgZmxhdHRlbjogZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmdW5jdGlvbiByZWN1cnNlIChjdXIsIHByb3ApIHtcbiAgICAgIGlmIChPYmplY3QoY3VyKSAhPT0gY3VyKSB7XG4gICAgICAgIHJlc3VsdFtwcm9wXSA9IGN1cjtcbiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShjdXIpKSB7XG4gICAgICAgIGZvcih2YXIgaT0wLCBsPWN1ci5sZW5ndGg7IGk8bDsgaSsrKVxuICAgICAgICAgIHJlY3Vyc2UoY3VyW2ldLCBwcm9wICsgXCJbXCIgKyBpICsgXCJdXCIpO1xuICAgICAgICAgIGlmIChsID09PSAwKVxuICAgICAgICAgICAgcmVzdWx0W3Byb3BdID0gW107XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpc0VtcHR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gY3VyKSB7XG4gICAgICAgICAgICAgIGlzRW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgcmVjdXJzZShjdXJbcF0sIHByb3AgPyBwcm9wK1wiLlwiK3AgOiBwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc0VtcHR5ICYmIHByb3ApXG4gICAgICAgICAgICAgIHJlc3VsdFtwcm9wXSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZWN1cnNlKGRhdGEsIFwiXCIpO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgdW5NYXJrTGlua3M6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGxpbmtzID0gdGhpc1swXS5xdWVyeVNlbGVjdG9yQWxsKCdhW2hyZWY9XCIvJytCYWNrYm9uZS5oaXN0b3J5LmZyYWdtZW50KydcIl0nKVxuICAgIGZvcih2YXIgaT0wO2k8bGlua3MubGVuZ3RoO2krKyl7XG4gICAgICBsaW5rcy5pdGVtKGkpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgbGlua3MuaXRlbShpKS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIG1hcmtMaW5rczogZnVuY3Rpb24oKXtcbiAgICB2YXIgbGlua3MgPSB0aGlzWzBdLnF1ZXJ5U2VsZWN0b3JBbGwoJ2FbaHJlZj1cIi8nK0JhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQrJ1wiXScpO1xuICAgIGZvcih2YXIgaT0wO2k8bGlua3MubGVuZ3RoO2krKyl7XG4gICAgICBsaW5rcy5pdGVtKGkpLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgbGlua3MuaXRlbShpKS5hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBodHRwOi8va3Jhc2ltaXJ0c29uZXYuY29tL2Jsb2cvYXJ0aWNsZS9Dcm9zcy1icm93c2VyLWhhbmRsaW5nLW9mLUFqYXgtcmVxdWVzdHMtaW4tYWJzdXJkanNcbiAgYWpheDogZnVuY3Rpb24ob3BzKSB7XG4gICAgICBpZih0eXBlb2Ygb3BzID09ICdzdHJpbmcnKSBvcHMgPSB7IHVybDogb3BzIH07XG4gICAgICBvcHMudXJsID0gb3BzLnVybCB8fCAnJztcbiAgICAgIG9wcy5qc29uID0gb3BzLmpzb24gfHwgdHJ1ZTtcbiAgICAgIG9wcy5tZXRob2QgPSBvcHMubWV0aG9kIHx8ICdnZXQnO1xuICAgICAgb3BzLmRhdGEgPSBvcHMuZGF0YSB8fCB7fTtcbiAgICAgIHZhciBnZXRQYXJhbXMgPSBmdW5jdGlvbihkYXRhLCB1cmwpIHtcbiAgICAgICAgICB2YXIgYXJyID0gW10sIHN0cjtcbiAgICAgICAgICBmb3IodmFyIG5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICBhcnIucHVzaChuYW1lICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbbmFtZV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RyID0gYXJyLmpvaW4oJyYnKTtcbiAgICAgICAgICBpZihzdHIgIT09ICcnKSB7XG4gICAgICAgICAgICAgIHJldHVybiB1cmwgPyAodXJsLmluZGV4T2YoJz8nKSA8IDAgPyAnPycgKyBzdHIgOiAnJicgKyBzdHIpIDogc3RyO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9O1xuICAgICAgdmFyIGFwaSA9IHtcbiAgICAgICAgICBob3N0OiB7fSxcbiAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbihvcHMpIHtcbiAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICB0aGlzLnhociA9IG51bGw7XG4gICAgICAgICAgICAgIGlmKHdpbmRvdy5BY3RpdmVYT2JqZWN0KSB7IHRoaXMueGhyID0gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7IH1cbiAgICAgICAgICAgICAgZWxzZSBpZih3aW5kb3cuWE1MSHR0cFJlcXVlc3QpIHsgdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTsgfVxuICAgICAgICAgICAgICBpZih0aGlzLnhocikge1xuICAgICAgICAgICAgICAgICAgdGhpcy54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi54aHIucmVhZHlTdGF0ZSA9PSA0ICYmIHNlbGYueGhyLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHNlbGYueGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYob3BzLmpzb24gPT09IHRydWUgJiYgdHlwZW9mIEpTT04gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRvbmVDYWxsYmFjayAmJiBzZWxmLmRvbmVDYWxsYmFjay5hcHBseShzZWxmLmhvc3QsIFtyZXN1bHQsIHNlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wcy5zdWNjZXNzICYmIG9wcy5zdWNjZXNzLmFwcGx5KHNlbGYuaG9zdCwgW3Jlc3VsdCwgc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoc2VsZi54aHIucmVhZHlTdGF0ZSA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmFpbENhbGxiYWNrICYmIHNlbGYuZmFpbENhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wcy5lcnJvciAmJiBvcHMuZXJyb3IuYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgc2VsZi5hbHdheXNDYWxsYmFjayAmJiBzZWxmLmFsd2F5c0NhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgb3BzLmNvbXBsZXRlICYmIG9wcy5jb21wbGV0ZS5hcHBseShzZWxmLmhvc3QsIFtzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZihvcHMubWV0aG9kID09ICdnZXQnKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vcGVuKFwiR0VUXCIsIG9wcy51cmwgKyBnZXRQYXJhbXMob3BzLmRhdGEsIG9wcy51cmwpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVycyh7XG4gICAgICAgICAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0J1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vcGVuKG9wcy5tZXRob2QsIG9wcy51cmwsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKHtcbiAgICAgICAgICAgICAgICAgICAgICAnWC1SZXF1ZXN0ZWQtV2l0aCc6ICdYTUxIdHRwUmVxdWVzdCcsXG4gICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZihvcHMuaGVhZGVycyAmJiB0eXBlb2Ygb3BzLmhlYWRlcnMgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVycyhvcHMuaGVhZGVycyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIG9wcy5tZXRob2QgPT0gJ2dldCcgPyBzZWxmLnhoci5zZW5kKCkgOiBzZWxmLnhoci5zZW5kKGdldFBhcmFtcyhvcHMuZGF0YSkpO1xuICAgICAgICAgICAgICB9LCAyMCk7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnhocjtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvbmU6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHRoaXMuZG9uZUNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFpbDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5mYWlsQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbHdheXM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHRoaXMuYWx3YXlzQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXRIZWFkZXJzOiBmdW5jdGlvbihoZWFkZXJzKSB7XG4gICAgICAgICAgICAgIGZvcih2YXIgbmFtZSBpbiBoZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhociAmJiB0aGlzLnhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBhcGkucHJvY2VzcyhvcHMpO1xuICB9XG59O1xuXG5fLmV4dGVuZCgkLCB1dGlscy5wcm90b3R5cGUpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgJDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
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
