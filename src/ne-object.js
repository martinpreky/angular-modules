
/**
 *                                                  NE OBJECT
 * ***************************************************************************************************************************
 */

angular.module('neObject',[])
.factory('neObject', ['$timeout', function($timeout){
    
    var hasOwn = Object.prototype.hasOwnProperty;
    function isPlainObject(obj) {
        if (!obj || Object.prototype.toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
            return false;

        var has_own_constructor = hasOwnProperty.call(obj, 'constructor');
        var has_is_property_of_method = hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf');
        // Not own constructor property must be Object
        if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
            return false;
        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.
        var key;
        for ( key in obj ) {}
        return key === undefined || hasOwn.call( obj, key );
    }

    function extend() {
        var options, name, src, copy, copyIsArray, clone,
            reservedInstances = this.extendReservedInstances,
            object = this,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        // Handle a deep copy situation
        if ( typeof target === 'boolean' || target === 'data' ) {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }
        // Handle case when target is a string or something (possible in deep copy)
        if ( typeof target !== 'object' && typeof target !== 'function') {
            target = {};
        }
        for ( ; i < length; i++ ) {
            options = arguments[ i ];
            
            if(isReservedInstance(options, reservedInstances)){
                target = options;
                return target;
            }
            
            // Only deal with non-null/undefined values
            else if ( options !== null ) {
                // Extend the base object
                for ( name in options ) {
                    src = target[ name ];
                    copy = options[ name ];
                    
                    // prevent modifying reserved instances
                    if ( isReservedInstance(copy, reservedInstances) ){
                        target[ name ] = copy;
                        continue;
                    }
                    
                    // Prevent never-ending loop
                    if ( target === copy ) {
                        continue;
                    }
                    // Recurse if we're merging plain objects or arrays
                    if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            if(deep === 'data') {
                                // if data mode, do not merge arrays, just copy
                                target[ name ] = copy.slice(0);
                                continue;
                            }
                            clone = src && Array.isArray(src) ? src : [];
                        } else {
                            clone = src && isPlainObject(src) ? src : {};
                        }  
                        // Never move original objects, clone them
                        target[ name ] = object.extend( deep, clone, copy );
                    // Don't bring in undefined values
                    } else if ( copy !== undefined ) {
                        target[ name ] = copy;
                    }
                }
            }
        }
        // Return the modified object
        return target;
    }
    
    function isReservedInstance(value, reservedInstances){
        for(var i=0;i<reservedInstances.length;i++){
            if(value instanceof reservedInstances[i]) return true;
        }
        return false;
    }
    
    function deepReplace(parentObj, cb, keyPath){ // cb(keyPath, key, value)
        if(!angular.isObject(parentObj)) return;
        keyPath = keyPath || '';
        var value;
        for(var key in parentObj){
            if(angular.isObject(parentObj[key])) deepReplace(parentObj[key], cb, (keyPath==='' ? key : keyPath + '.' + key));
            value = cb((keyPath==='' ? key : keyPath + '.' + key), key, parentObj[key]);
            if(value===undefined) delete parentObj[key];
            else parentObj[key] = value;
        }
    }
    
    /**
     * Define cascading props in objects in namespace separated by dot,
     * if props are on lower level, it will create empty object
     * @param {Object} parent base object where you want add props
     * @param {String} namespace dot separated
     * @param {Object} value value to add to object prop
     * @param {String} mode if "push", it will add value to array
     * @returns {Object}  parent object after properties are added
     */
    function deepSet(parent, namespace, value, mode) {
        // if(typeof value==='string') value = value.replace(/(\r\n|\r|\n)\s*$/, ''); // replace line endings and white spaces
        var parts = namespace.split('.');
        var current = parent;
        if(namespace==='this') {
            if(mode==='push') parent.push(value);
            else parent = value.toString();
        }
        else {
            for(var i=0; i<parts.length; i++) {
            if(i >= parts.length-1) {
                if(mode==='push') current[parts[i]].push(value);
                else current[parts[i]] = value;
            }
            else current[parts[i]] = current[parts[i]]===undefined || current[parts[i]]===null ? {} : current[parts[i]];    
            current = current[parts[i]];
            }
        }
        return parent;
    }
    
    function deepGet(parent, namespace) {
        if((!parent && parent!==false && parent!==0) || typeof parent === 'function') return undefined;
        if(namespace==='this') return parent;
        
        var parts = namespace.split('.');
        var current = parent;
        
        for(var i=0; i<parts.length; i++) {
            if(!current[parts[i]] && current[parts[i]]!==false && current[parts[i]]!==0) return undefined;
            else current = current[parts[i]];
        }
        
        // function as value is not allowed
        if(typeof current === 'function') return undefined;
        return current;
    }
    
    function deepRemove(obj, keyPath){
        obj = obj || {};
        keyPath = keyPath || '';
        var keys = keyPath.split('.');
        if(keys.length===0) return;
        if(keys.length===1) { delete obj[keys[0]]; return; }
        
        for(var i=0;i < keys.length-1;i++) {
            obj = obj[keys[i]];
            if(!obj) return;
        }
        delete obj[keys[keys.length-1]]; // delete last prop
    }
    
    function sortArray(keyName, dir, array){ // sortArray({ key1:1, key2:-1 }, dir)
        var keys;
        
        if(arguments.length===2){
            if(isObject(keyName)) {
                keys = keyName;
                array = arguments[1];
            }
            else {
                array = arguments[1];
                dir = 1;
            }
        }
        else {
            keys = {};
            keys[keyName] = dir;
        }
        
        for(var key in keys){
            if(keys[key]==='asc') keys[key] = 1;
            if(keys[key]==='desc') keys[key] = -1;
        }
        
        array.sort(function(a, b) {
            for(var key in keys){
                if( deepGet(a, key) > deepGet(b, key)) return keys[key];
                if( deepGet(a, key) < deepGet(b, key)) return -keys[key];
            }
            return 0;
        });
        
        return array;
    }
    
    function objectToArray(obj, sortNamespace, dir){
        var array = [];
        
        for(var key in obj) {
            if(key!=='$key' && key!=='$sortIndex' && obj.hasOwnProperty(key)){
                obj.$key = key;
                if(sortNamespace) obj.$sortIndex = deepGet(obj[key], sortNamespace);
                array.push(obj[key]);
            }
        }
        return sortNamespace ? sortArray('$sortIndex', dir || 'asc', array) : array;
    }
    
    function arrayToObject(array, idNamespace){
        if(!angular.isArray(array) || !idNamespace) return {};

        var obj = {}, key;
        for(var i=0;i<array.length;i++){
            key = deepGet(array[i], idNamespace);
            obj[key] = array[i];
        }

        return obj;
    }
    
    function isRegExp(value) {
        return Object.prototype.toString.call(value) === '[object RegExp]';
    }
    
    function isWindow(obj) {
        return obj && obj.window === obj;
    }


    function isScope(obj) {
        return obj && obj.$evalAsync && obj.$watch;
    }
    
    function defaultExcludeKeyFnc(key){
        if(key[0] === '$' && key[1] === '$') return true;
    }

    // modified angular equals to support single dollar key prefixes
    function deepEquals(o1, o2, excludeKeyFnc) {
        excludeKeyFnc = excludeKeyFnc || defaultExcludeKeyFnc;
        
        if (o1 === o2) return true;
        if (o1 === null || o2 === null) return false;
        if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
        var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
        if (t1 == t2 && t1 == 'object') {
            if (angular.isArray(o1)) {
                if (!angular.isArray(o2)) return false;
                if ((length = o1.length) == o2.length) {
                    for (key = 0; key < length; key++) {
                        if (!deepEquals(o1[key], o2[key], excludeKeyFnc)) return false;
                    }
                    return true;
                }
            } else if (angular.isDate(o1)) {
                if (!angular.isDate(o2)) return false;
                return deepEquals(o1.getTime(), o2.getTime(), excludeKeyFnc);
            } else if (isRegExp(o1)) {
                if (!isRegExp(o2)) return false;
                return o1.toString() == o2.toString();
            } else {
                if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2) ||
                    angular.isArray(o2) || angular.isDate(o2) || isRegExp(o2)) return false;
                keySet = Object.create(null);
                for (key in o1) {
                    if (excludeKeyFnc(key) || angular.isFunction(o1[key])) continue;
                    if (!deepEquals(o1[key], o2[key], excludeKeyFnc)) return false;
                    keySet[key] = true;
                }
                for (key in o2) {
                    if (!(key in keySet) &&
                        !excludeKeyFnc(key) &&
                        angular.isDefined(o2[key]) &&
                        !angular.isFunction(o2[key])) return false;
                }
                return true;
            }
        }
        return false;
    }
    
    
    /**
     * Service function that helps to avoid multiple calls of a function (typically save()) during angular digest cycle.
     * $apply will be called after original function returns;
     *
     * @example:
     *  $scope.save = debounce(function(order){
     *     // POST your order here ...$http....
     *     // debounce() will make sure save() will be called only once
     *   });
     */
    function debounce(fn, timeout, apply){ // debounce fn
        timeout = angular.isUndefined(timeout) ? 0 : timeout;
        apply = angular.isUndefined(apply) ? true : apply; // !!default is true! most suitable to my experience
        var prevTimeout;
        return function(){ // intercepting fn
            if(prevTimeout) $timeout.cancel(prevTimeout);
            var that = this;
            var argz = arguments;
            
            prevTimeout = $timeout(function(){
                prevTimeout = null;
                fn.apply(that, argz);
            }, timeout, apply);
            
            return prevTimeout;
        };
    }
    
    // auto parse dates
    var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;
    var regexIsoStrict = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;

    function dateStringsToDates(input, useStrictDateParser) {
        if(useStrictDateParser === undefined) useStrictDateParser = true; // only if forced to not use strict
        var value, match, milliseconds;

        // try to parse if input is string
        if(typeof input === 'string' && (match = input.match(useStrictDateParser ? regexIsoStrict : regexIso8601))) {
            milliseconds = Date.parse(match[0]);
            if (!isNaN(milliseconds)) {
                input = new Date(milliseconds);
            }
            return input;
        }

        // Ignore things that aren't objects
        else if(typeof input !== 'object') return input;

        for(var key in input){
            value = input[key];

            // Check for string properties which look like dates.
            if(typeof value === 'string' && (match = value.match(useStrictDateParser ? regexIsoStrict : regexIso8601))) {
                milliseconds = Date.parse(match[0]);
                if (!isNaN(milliseconds)) {
                    input[key] = new Date(milliseconds);
                }
            }
            else if (typeof value === 'object') {
                // Recurse into object
                dateStringsToDates(value, useStrictDateParser);
            }
        }        
        return input;
    }
    
    function fromJson(str, useStrictDateParser){
        var result;
        try {
            result = JSON.parse(str);
        }
        catch(err){}
        
        return dateStringsToDates(result, useStrictDateParser);
    }
    
    function removePrefixedProps(input, prefix) {

        // Ignore things that aren't objects.
        if(typeof input !== 'object' || !prefix) return input;

        for(var key in input) {
            if(input.hasOwnProperty(key)) {
                var value = input[key];

                if(key.indexOf(prefix)===0) delete input[key];
                else if(typeof value === 'object') removePrefixedProps(value, prefix);
            }
        }
    }
    
    function isObject(obj){
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    function isArray(obj){
        return Array.isArray(obj);
    }

    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    function guid() {
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
    
    return {
        isObject: isObject,
        isArray: isArray,
        sortArray: sortArray,
        extendReservedInstances: [File, FileList, Blob],
        extend: extend,
        merge: extend,
        setObjValue: deepSet,
        deepSet: deepSet,
        getObjValue: deepGet,
        deepGet: deepGet,
        deepReplace: deepReplace,
        deepRemove: deepRemove,
        deepEquals: deepEquals,
        deepEqual: deepEquals,
        objectToArray: objectToArray,
        arrayToObject: arrayToObject,
        dateStringsToDates: dateStringsToDates,
        fromJson: fromJson,
        fromJSON: fromJson,
        removePrefixedProps: removePrefixedProps,
        debounce: debounce,
        guid: guid
    };

}]);