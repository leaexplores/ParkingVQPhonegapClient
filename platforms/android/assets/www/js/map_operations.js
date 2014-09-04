/*jslint nomen: true*/
/*global L,$,console, markers, map, ajouterWaypointALaMap, showOverlayMap*/
var locsLoadedInMemory, reducedDataset;

function isLocsLoadedInMemory() {
    "use strict";
    if (locsLoadedInMemory !== undefined && locsLoadedInMemory.swX !== undefined && locsLoadedInMemory.swY !== undefined && locsLoadedInMemory.neX !== undefined && locsLoadedInMemory.neY !== undefined) {
        return true;
    } else {
        return false;
    }
}

// Obtiens la zone cache de waypoints qu'on load en memoire...
function getBiggerBounds() {
    "use strict";
    return 0.03;
}

function addNonViewedBoundsToLoc(parToAdd, isItSw) {
    "use strict";
    if (isItSw) {
        return parToAdd - getBiggerBounds();
    } else {
        return parToAdd + getBiggerBounds();
    }
}

function updateLocsInMemory(latlngbounds) {
    "use strict";
    if (locsLoadedInMemory !== undefined) {
        locsLoadedInMemory.swY = addNonViewedBoundsToLoc(latlngbounds._southWest.lat, true);
        locsLoadedInMemory.swX = addNonViewedBoundsToLoc(latlngbounds._southWest.lng, true);
        locsLoadedInMemory.neY = addNonViewedBoundsToLoc(latlngbounds._northEast.lat, false);
        locsLoadedInMemory.neX = addNonViewedBoundsToLoc(latlngbounds._northEast.lng, false);
    } else {
        locsLoadedInMemory = {
            swY: addNonViewedBoundsToLoc(latlngbounds._southWest.lat, true),
            swX: addNonViewedBoundsToLoc(latlngbounds._southWest.lng, true),
            neY: addNonViewedBoundsToLoc(latlngbounds._northEast.lat, false),
            neX: addNonViewedBoundsToLoc(latlngbounds._northEast.lng, false)
        };
    }
}

function isPolyInBounds(swY, swX, neY, neX) {
    "use strict";
    if ((neY > locsLoadedInMemory.neY || swY > locsLoadedInMemory.swY) && (neX < locsLoadedInMemory.neX || swX < locsLoadedInMemory.swX)) {
        return true;
    } else {
        return false;
    }
}

function shouldILoadUsingDelta(mapBounds, zoomLevel) {
    "use strict";
    if ((zoomLevel >= 14 && reducedDataset === false) || (zoomLevel < 14 && reducedDataset === true)) {
        return true; // We still in the detailed dataset :)
    } else {
        return false;
    }
}

function evaluateIfIShouldLoadWaypointsFromApi(mapBounds, zoomLevel) {
    "use strict";
    if (zoomLevel >= 14 && reducedDataset === true) {
        return true; // We zoomed in
    } else {
        if (zoomLevel < 14 && reducedDataset === false) {
            return true;
        } else {
            if (isLocsLoadedInMemory()) {
                if (
                    isPolyInBounds(mapBounds._southWest.lat, mapBounds._southWest.lng, mapBounds._northEast.lat, mapBounds._northEast.lng)
                ) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        }
    }
}

function clearWaypoints() {
    "use strict";
    if (markers !== undefined && markers !== null) {
        map.removeLayer(markers);
    }
}


function trouverCenterFromBounds(h1, h2, b1, b2) {
    "use strict";
    var ih1, ih2, ib1, ib2, centreH, centreB, point;
    ih1 = parseFloat(h1);
    ih2 = parseFloat(h2);
    ib1 = parseFloat(b1);
    ib2 = parseFloat(b2);

    centreH = (ih1 + ih2) / 2;
    centreB = (ib1 + ib2) / 2;
    point = {
        lat: centreH,
        lng: centreB
    };
    return point;
}


function ajouterWaypointsDelta(latlngBounds, zoomLevel) {
    "use strict";

    function getUrlForZoomLevel(latlngBounds, zoomLevel) {

        var baseUrl = "http://vps84512.ovh.net:4711/api/parking/" + locsLoadedInMemory.swY + "/" +
            locsLoadedInMemory.swX + "/" + locsLoadedInMemory.neY + "/" + locsLoadedInMemory.neX;

        if (zoomLevel >= 14) {
            if (reducedDataset) {
                reducedDataset = false;
            }
            return baseUrl + "/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lat, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lng, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lat, false) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lng, false) + "?roundloc=5";
        } else {
            if (!reducedDataset) {
                reducedDataset = true;
            }
            return baseUrl + "/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lat, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lng, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lat, false) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lng, false) + "?roundloc=2";
        }
    }

    function calculerNewBounds(latlngBounds) {
        var newBounds = {
            _southWest: {lat:undefined,
                         lng:undefined},
            _northEast: {lat:undefined,
                         lng:undefined}
        };

        if (latlngBounds._southWest.lng < locsLoadedInMemory.swX) {
            newBounds._southWest.lng = latlngBounds._southWest.lng;
        } else {
            newBounds._southWest.lng = locsLoadedInMemory.swX;
        }

        if (latlngBounds._southWest.lat < locsLoadedInMemory.swY) {
            newBounds._southWest.lat = latlngBounds._southWest.lat;
        } else {
            newBounds._southWest.lat = locsLoadedInMemory.swY;
        }

        if (latlngBounds._northEast.lng > locsLoadedInMemory.neX) {
            newBounds._northEast.lng = latlngBounds._northEast.lng;
        } else {
            newBounds._northEast.lng = locsLoadedInMemory.neX;
        }

        if (latlngBounds._northEast.lat > locsLoadedInMemory.neY) {
            newBounds._northEast.lat = latlngBounds._northEast.lat;
        } else {
            newBounds._northEast.lat = locsLoadedInMemory.neY;
        }

        return newBounds;
    }


    var url, geojsonFeature, geoJsonToShow;
    geojsonFeature = new L.GeoJSON();
    geoJsonToShow = {};
    latlngBounds = calculerNewBounds(latlngBounds)
    url = getUrlForZoomLevel(latlngBounds, zoomLevel);
    // console.log(url);
    showOverlayMap();
    console.log(url);
    $.getJSON(url, function (data) {
        geoJsonToShow = {
            "features": data.features,
            "name": data.name,
            "type": data.type
        };
        updateLocsInMemory(latlngBounds);
        ajouterWaypointALaMap(geoJsonToShow);
    });
}

function ajouterWaypointsBounds(latlngBounds, zoomLevel) {
    "use strict";

    function getUrlForZoomLevel(latlngBounds, zoomLevel) {
        if (zoomLevel >= 14) {
            if (reducedDataset) {
                reducedDataset = false;
            }
            return "http://vps84512.ovh.net:4711/api/parking/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lat, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lng, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lat, false) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lng, false) + "?roundloc=5";
        } else {
            if (!reducedDataset) {
                reducedDataset = true;
            }
            return "http://vps84512.ovh.net:4711/api/parking/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lat, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lng, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lat, false) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lng, false) + "?roundloc=2";
        }
    }
    var url, geojsonFeature, geoJsonToShow;
    geojsonFeature = new L.GeoJSON();
    geoJsonToShow = {};
    url = getUrlForZoomLevel(latlngBounds, zoomLevel);
    // console.log(url);
    showOverlayMap();
    $.getJSON(url, function (data) {
        geoJsonToShow = {
            "features": data.features,
            "name": data.name,
            "type": data.type
        };
        updateLocsInMemory(latlngBounds);
        ajouterWaypointALaMap(geoJsonToShow);
    });
}
