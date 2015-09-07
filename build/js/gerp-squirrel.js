var GerpSquirrel;
(function (GerpSquirrel) {
    var RunLoop = (function () {
        function RunLoop() {
        }
        return RunLoop;
    })();
})(GerpSquirrel || (GerpSquirrel = {}));
/// <reference path="../engine/runloop.ts" />
console.log('herp derp girp chirp');
var Client;
(function (Client) {
    function init(element) {
        console.log('fdsafasd');
        var context = element.getContext('2d');
        context.fillStyle = '#000000';
        context.fillRect(0, 0, element.width, element.height);
    }
    Client.init = init;
    function fsadfs() {
        alert('fdsafdsa');
    }
})(Client || (Client = {}));
