let map;
let directionsService;
let directionsRenderer;
let clickCount = 0;
let origin = null;
let destination = null;
let markers = [];
let startAutocomplete, endAutocomplete;

function initMap() {
  const bounds = {
    north: 40.0145,
    south: 39.995307,
    west: -105.277403,
    east: -105.246754,
  };

  const center = { lat: 40.0060, lng: -105.2670 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: center,
    restriction: {
      latLngBounds: bounds,
      strictBounds: true,
    },
    maxZoom: 21,
    minZoom: 0,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false,
  });

  // Map click to set start/end and draw route
  map.addListener("click", (e) => {
    handleMapClick(e.latLng);
  });

  // Autocomplete for input fields
  startAutocomplete = new google.maps.places.Autocomplete(document.getElementById("start"));
  endAutocomplete = new google.maps.places.Autocomplete(document.getElementById("end"));

  startAutocomplete.bindTo("bounds", map);
  endAutocomplete.bindTo("bounds", map);
}

function handleMapClick(latLng) {
  if (clickCount === 0) {
    origin = latLng;
    addTempMarker(latLng, "Start");
    clickCount++;
  } else if (clickCount === 1) {
    destination = latLng;
    addTempMarker(latLng, "End");
    showRoute(origin, destination);
    clickCount = 0;
  }
}

function calculateRoute() {
  const startInput = document.getElementById("start").value;
  const endInput = document.getElementById("end").value;

  if (!startInput || !endInput) {
    alert("Please enter both start and end places.");
    return;
  }

  directionsService.route(
    {
      origin: startInput,
      destination: endInput,
      travelMode: google.maps.TravelMode.WALKING,
    },
    (result, status) => {
      if (status === "OK") {
        clearTempMarkers();
        directionsRenderer.setDirections(result);
      } else {
        alert("Route search failed: " + status);
      }
    }
  );
}

function showRoute(start, end) {
  directionsService.route(
    {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.WALKING,
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
      } else {
        console.error("Route calculation failed: " + status);
      }
    }
  );
}

function addTempMarker(position, title) {
  const marker = new google.maps.Marker({
    position: position,
    map: map,
    title: title,
  });
  markers.push(marker);
}

function clearTempMarkers() {
  for (let m of markers) m.setMap(null);
  markers = [];
  clickCount = 0;
  origin = null;
  destination = null;
  directionsRenderer.setDirections({ routes: [] }); // Clear route line
}
