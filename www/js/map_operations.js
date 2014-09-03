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


function addNonViewedBoundsToLoc(parToAdd, isItSw) {
    "use strict";
    if (isItSw) {
        return parToAdd - 0.2;
    } else {
        return parToAdd + 0.2;
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

function isPointInPoly(ptLat, ptLng) {
    // Algo trouvé sur...
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    "use strict";
    var x, y, xi, yi, xj, yj, intersect, inside;
    x = ptLng;
    y = ptLat;
    inside = false;
    xi = locsLoadedInMemory.neY;
    yi = locsLoadedInMemory.swY;
    xj = locsLoadedInMemory.neX;
    yj = locsLoadedInMemory.neY;
    intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) {
        inside = !inside;
    }

    return inside;
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
                    isPointInPoly(mapBounds._southWest.lat,
                        mapBounds._southWest.lng) && isPointInPoly(mapBounds._northEast.lat,
                        mapBounds._northEast.lng)
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
            return "http://vps84512.ovh.net:4711/api/parking/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lat, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._southWest.lng, true) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lat, false) + "/" + addNonViewedBoundsToLoc(latlngBounds._northEast.lng, false) + "?roundloc=3";
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
