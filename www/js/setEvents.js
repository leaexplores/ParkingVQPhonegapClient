/*global $*/
// Ce script change le contenu disponible !

function templateShowMap() {
    "use strict";
    $('#main-content').html("<div id=\"progress\"><div id=\"progress-bar\"></div></div><div id=\"map\"></div><script>initMap();<\/script>");
}

$('#btnLegend').click(function () {
    "use strict";
    templateAskParking();
});

$('#btnShowMap').click(function () {
    "use strict";
    templateShowMap();
});
