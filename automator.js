(function ($) {
    var settings = {
        delay: 500 // milliseconds
    };

    var automation = {};
    var callback = {};

    var fns = {
        /**
         * Store automation (the callback) with given title.
         * @param title
         * @param callback
         */
        add: function (title, callback) {
            automation[title] = callback;
        },

        /**
         * Run the automation indexed by title.
         * @param title
         */
        run: function (title) {
            automation[title]();
        },

        setCallback: function (title, callback) {
            callback[title] = callback;
        },

        // TODO Not sure how to document script param properly with jqDoc, is it possible?
        /**
         * Run the given script to simulate user interaction
         * @param {object[]} script
         *
         *  {string} [script.path]
         *    jQuery selector to element in the DOM, may not contain single quotes
         *
         *  {function} [script.callback]
         *    Code to run for this element. Will be passed one parameter, elem
         *
         *  {string} [script.value]
         *    Value to set on the element
         *
         *  {string} [script.ngValue]
         *    Use this with AngularJS
         *
         *  {number} [script.delay]
         *    Delay in milliseconds to wait before looking for the path
         *
         *  {string} [script.event="click"]
         *    Event to trigger if value not given
         *
         *  {string} [script.finished]
         *    Index into $.automator("callbacks")
         *    Call this when the script has finished execution.
         *    Must be a property on the last element in script.
         *
         * @param {Object} [options]
         * @param {Boolean} [options.debug=false]
         *  Show debugging information
         */
        runScript: function (script, options) {
            options = options || {};

            var delay = 0;
            var scriptLen = script.length;
            var debug = (typeof options.debug === "undefined")
                ? false
                : options.debug;

            for (var r = 0; r < scriptLen; r++) {
                script[r].delay = script[r].delay || settings.delay;

                var path = script[r].path;
                if (path) {
                    if (typeof path == "function") {
                        // Evaluation path function
                        path = path();

                    } else {
                        // Validate path
                        if (path.match("'")) {
                            throw new Error("Automator.runScript: path may not contain singe quotes");
                        }

                        // Escape the escape
                        path.replace("\"", "\\\"");
                    }
                }

                var code;

                // We were passed a callback, run it
                if (script[r].callback) {
                    code = "";
                    code += "var elem = $('" + path + "');";
                    if (options.debug) {
                        code += "console.info('" + path + "', elem);";
                    }
                    code += "var callback = " + script[r].callback.toString() + ";";
                    code += "callback(elem);";
                    setTimeout(
                        code,
                        delay + script[r].delay
                    );

                } else if (script[r].value) {
                    // We were passed a value, try to fill it in
                    var value = script[r].value;

                    code = "";
                    code += "var elem = $('" + path + "');";
                    if (debug) {
                        code += "console.info('" + path + "', elem);";
                    }
                    code += "if (elem.is(\"input[type='radio']\")) {"; // Radio
                    if (debug) {
                        code += "  console.info('- Radio');";
                    }
                    code += "  elem.attr('checked', 'checked');";
                    code += "} else if (elem.is(\"input[type='checkbox']\")) {"; // Checkbox
                    if (debug) {
                        code += "  console.info('- Checkbox');";
                    }
                    code += "  elem.attr('checked', 'checked');";
                    code += "} else if (elem.is('input')) {"; // Input
                    if (debug) {
                        code += "  console.info('- Input');";
                    }
                    code += "  elem.val('" + value + "');";
                    code += "} else if (elem.is('select')) {"; // Select
                    if (debug) {
                        code += "  console.info('- Select');";
                    }
                    code += "  elem.val('" + value + "')";
                    code += "} else {"; // Non-form elements like span and div
                    if (debug) {
                        code += "  console.info('- Non-form');";
                    }
                    code += "  elem.text('" + value + "');";
                    code += "}";
                    code += "if (elem.length > 0) {";
                    code += "  elem.trigger('change');";
                    code += "}";
                    setTimeout(
                        code,
                        delay + script[r].delay
                    );

                } else if (script[r].ngValue) {
                    // Use this with AngularJS
                    var ngValue = script[r].ngValue;
                    if (typeof ngValue == "string") {
                        ngValue = "\"" + ngValue + "\""
                    }
                    code = "";
                    code += "var elem = $('" + path + "');";
                    code += "if (elem.length > 0) {";
                    code += "  var scope = angular.element(elem).scope();";
                    code += "  var ngModel = angular.element(elem).controller(\"ngModel\");";
                    code += "  ngModel.$setViewValue(" + ngValue + ");";
                    code += "  ngModel.$render();";
                    code += "  scope.$apply();";
                    code += "}";
                    setTimeout(
                        code,
                        delay + script[r].delay
                    );

                } else if (path) {
                    // If not passed a value trigger an event on the selector
                    var event = script[r].event || "click"; // Default event is click

                    code = "";
                    code += "var elem = $('" + path + "');";
                    if (debug) {
                        code += "console.info('" + path + "', elem);";
                    }
                    if (debug) {
                        code += "console.info('" + event + "');";
                    }
                    code += "if (elem.length > 0) {";
                    code += "  elem.trigger('" + event + "');";
                    code += "}";
                    setTimeout(
                        code,
                        delay + script[r].delay
                    );
                }

                // Update total delay
                delay += script[r].delay;

                // Call script finished callback if given
                if ((r === scriptLen - 1)) {
                    code = "";
                    code += "var elem = $('" + path + "');";
                    var scriptExecutionTime = delay;
                    if ((script[r].finished)) {
                        code += "var onFinished = " + script[r].finished.toString() + ";";
                        code += "onFinished(elem, " + scriptExecutionTime + ");";
                    }
                    if (debug) {
                        code += "console.info('--- finished " + scriptExecutionTime + "');";
                    }
                    setTimeout(
                        code,
                        scriptExecutionTime
                    );
                }
            }
        }
    };

    // ...........................................................................
    $.fn.automator = function (options) {
        // TODO Allow overriding settings

        // Below is consistent with standard way of calling jQuery plugin methods.
        if (typeof options == "string") {
            var args = Array.prototype.slice.call(arguments, 1);
            if (fns[options]) {
                fns[options].apply(this, args);
            }
        }

        // We might want chaining?
        return this;
    };

}(jQuery));

