# jquery-automator

A jQuery plugin "for automating web applications for testing purposes", 
kind of like [selenium](http://www.seleniumhq.org/)

Useful when working with Single Page Applications. 


# Usage 

Include the plugin, a test script 
and then specify which test to run, for example:

    <body>
    ...
    <script src="automator.js"></script>
    <script src="test.js"></script>
    <script>
        automator("run", "MyTest");
    </script>
    </body>


# Writing tests

See the examples folder.

`automator` will iterate over the test "path selectors" with a delay 
(default is 500ms) between each iteration. This is useful when the action for 
that iteration is something like an Ajax request.







