let map;
let directionsService;
let directionsRenderer;
let clickCount = 0;
let origin = null;
let destination = null;
let markers = [];

function initMap() {
  const bounds = {
    north: 40.0145,
    south: 39.995307,
    west: -105.277403,
    east: -105.246754,
  };

  const center = { lat: 40.0060, lng: -105.2670 };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: center,
    restriction: {
      latLngBounds: bounds,
      strictBounds: true,
    },
  });

  const buildings = [
    { name: "Engineering Center", position: { lat: 40.0063, lng: -105.2628 } },
    { name: "Norlin Library", position: { lat: 40.0076, lng: -105.2719 } },
  ];

  buildings.forEach((building) => {
    const marker = new google.maps.Marker({
      position: building.position,
      map: map,
      title: building.name,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<strong>${building.name}</strong>`,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false,
  });

  // Show default route between buildings
  showCampusDirections(buildings[0].position, buildings[1].position);

  // Add click-to-route support
  map.addListener("click", (e) => {
    handleMapClick(e.latLng);
  });
}

function showCampusDirections(start, end) {
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
        console.error("Directions request failed due to " + status);
      }
    }
  );
}

function handleMapClick(latLng) {
  if (clickCount === 0) {
    origin = latLng;
    addTempMarker(latLng, "Start");
    clickCount++;
  } else if (clickCount === 1) {
    destination = latLng;
    addTempMarker(latLng, "End");
    showCampusDirections(origin, destination);
    clickCount = 0;
  }
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
}
