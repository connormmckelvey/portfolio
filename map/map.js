(async () => {
  const tripListEl = document.querySelector('[data-trip-list]');
  const filtersEl = document.querySelector('[data-year-filters]');
  const statusEl = document.querySelector('[data-map-status]');
  const searchEl = document.querySelector('[data-trip-search]');
  const resetBtn = document.querySelector('[data-reset-filters]');
  const tripCountEl = document.querySelector('[data-trip-count]');

  const selectedTitleEl = document.querySelector('[data-selected-title]');
  const selectedMetaEl = document.querySelector('[data-selected-meta]');

  const detailRoot = document.querySelector('[data-trip-detail]');
  const detailPhotoEl = document.querySelector('[data-trip-photo]');
  const detailKickerEl = document.querySelector('[data-trip-kicker]');
  const detailTitleEl = document.querySelector('[data-trip-title]');
  const detailMetaEl = document.querySelector('[data-trip-meta]');
  const detailTagsEl = document.querySelector('[data-trip-tags]');
  const detailNoteEl = document.querySelector('[data-trip-note]');

  if (!tripListEl || !filtersEl || !detailRoot) return;

  const mapContainer = document.getElementById('trip-map');
  if (!mapContainer || typeof L === 'undefined') {
    if (statusEl) statusEl.textContent = 'Map library failed to load.';
    return;
  }

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const map = L.map(mapContainer, {
    zoomControl: true,
    scrollWheelZoom: false,
    worldCopyJump: true,
    zoomAnimation: !reducedMotion,
    markerZoomAnimation: !reducedMotion,
    fadeAnimation: !reducedMotion,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  const pinIcon = (active = false) => L.divIcon({
    className: '',
    html: `<div class="trip-pin${active ? ' is-active' : ''}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -14],
  });

  const toLower = (value) => String(value || '').toLowerCase();

  const loadTrips = async () => {
    const response = await fetch('./trips.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load trips (${response.status})`);
    const data = await response.json();
    const trips = Array.isArray(data) ? data : Array.isArray(data.trips) ? data.trips : [];
    return trips
      .filter((trip) => trip && trip.id && Array.isArray(trip.coords) && trip.coords.length === 2)
      .map((trip) => ({
        ...trip,
        year: trip.year || String(trip.sortDate || trip.dateLabel || '').slice(0, 4),
        searchText: toLower([trip.title, trip.place, trip.region, trip.dateLabel, trip.note, ...(trip.tags || [])].join(' ')),
      }))
      .sort((a, b) => String(b.sortDate || b.year || '').localeCompare(String(a.sortDate || a.year || '')));
  };

  let trips = [];
  let markers = new Map();
  let selectedId = null;
  let activeYear = 'all';
  let searchTerm = '';

  const normalizeTags = (trip) => Array.isArray(trip.tags) ? trip.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];

  const filteredTrips = () => {
    const query = toLower(searchTerm).trim();
    return trips.filter((trip) => {
      const yearMatch = activeYear === 'all' || String(trip.year) === String(activeYear);
      const searchMatch = !query || trip.searchText.includes(query);
      return yearMatch && searchMatch;
    });
  };

  const buildYearFilters = () => {
    const years = [...new Set(trips.map((trip) => String(trip.year)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const buttons = ['all', ...years].map((year) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'map-filter';
      button.dataset.year = year;
      button.textContent = year === 'all' ? `all (${trips.length})` : `${year} (${trips.filter((trip) => String(trip.year) === year).length})`;
      button.setAttribute('aria-pressed', String(year === activeYear));
      button.addEventListener('click', () => {
        activeYear = year;
        render();
      });
      return button;
    });

    filtersEl.replaceChildren(...buttons);
  };

  const setActiveFilterUI = () => {
    const buttons = [...document.querySelectorAll('.map-filter')];
    for (const button of buttons) {
      const isActive = button.dataset.year === activeYear;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    }
  };

  const updateOverlay = (trip) => {
    if (!selectedTitleEl || !selectedMetaEl) return;
    if (!trip) {
      selectedTitleEl.textContent = 'Choose a trip';
      selectedMetaEl.textContent = 'Open a pin or card to focus the map.';
      return;
    }

    selectedTitleEl.textContent = trip.title;
    selectedMetaEl.textContent = `${trip.place} · ${trip.dateLabel || trip.year}`;
  };

  const updateDetail = (trip) => {
    if (!trip) {
      detailPhotoEl.src = '../images/about/weekend-reset.jpg';
      detailPhotoEl.alt = 'Trip preview';
      detailKickerEl.textContent = 'Trip log';
      detailTitleEl.textContent = 'Choose a trip';
      detailMetaEl.textContent = '';
      detailTagsEl.replaceChildren();
      detailNoteEl.textContent = 'Pick a pin or card to read the notes, review the photos, and jump the map to that place.';
      return;
    }

    const firstPhoto = Array.isArray(trip.photos) ? trip.photos[0] : null;
    detailPhotoEl.src = firstPhoto?.src || '../images/about/weekend-reset.jpg';
    detailPhotoEl.alt = firstPhoto?.alt || trip.title;
    detailKickerEl.textContent = trip.year ? `trip · ${trip.year}` : 'Trip log';
    detailTitleEl.textContent = trip.title;
    detailMetaEl.textContent = `${trip.place}${trip.dateLabel ? ` · ${trip.dateLabel}` : ''}`;
    detailTagsEl.replaceChildren(
      ...normalizeTags(trip).map((tag) => {
        const span = document.createElement('span');
        span.textContent = tag;
        return span;
      })
    );
    detailNoteEl.textContent = trip.note || '';
  };

  const updateMarkers = (visibleTrips) => {
    for (const [tripId, marker] of markers.entries()) {
      const trip = trips.find((entry) => entry.id === tripId);
      if (!trip) continue;
      const isVisible = visibleTrips.some((entry) => entry.id === tripId);
      const isSelected = tripId === selectedId;
      marker.setIcon(pinIcon(isSelected));
      if (isVisible && !map.hasLayer(marker)) marker.addTo(map);
      if (!isVisible && map.hasLayer(marker)) marker.removeFrom(map);
    }
  };

  const selectTrip = (tripId, options = {}) => {
    const trip = trips.find((entry) => entry.id === tripId);
    if (!trip) return;

    selectedId = tripId;
    updateDetail(trip);
    updateOverlay(trip);

    const visible = filteredTrips();
    const marker = markers.get(trip.id);
    if (marker) {
      const zoom = Math.max(map.getZoom(), 4);
      if (options.panTo !== false) {
        map.setView(trip.coords, zoom, { animate: !reducedMotion });
      }
      marker.openPopup();
    }

    const activeCard = document.querySelector(`.trip-item[data-trip-id="${trip.id}"]`);
    document.querySelectorAll('.trip-item').forEach((card) => card.classList.toggle('is-active', card === activeCard));

    if (activeCard) activeCard.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });

    history.replaceState(null, '', `#${trip.id}`);
    setActiveFilterUI();
    updateMarkers(visible);
  };

  const createPopup = (trip) => {
    const popup = document.createElement('div');
    popup.innerHTML = `<strong>${trip.title}</strong>${trip.place}<small>${trip.dateLabel || trip.year}</small>`;
    return popup;
  };

  const renderList = (visibleTrips) => {
    tripListEl.replaceChildren();

    if (!visibleTrips.length) {
      const empty = document.createElement('div');
      empty.className = 'trip-empty';
      empty.textContent = 'No trips match the current filters.';
      tripListEl.append(empty);
      return;
    }

    visibleTrips.forEach((trip) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'trip-item';
      button.dataset.tripId = trip.id;

      const media = document.createElement('div');
      media.className = 'trip-item-media';
      const image = document.createElement('img');
      const firstPhoto = Array.isArray(trip.photos) ? trip.photos[0] : null;
      image.src = firstPhoto?.src || '../images/about/weekend-reset.jpg';
      image.alt = firstPhoto?.alt || trip.title;
      image.loading = 'lazy';
      media.append(image);

      const body = document.createElement('div');
      body.className = 'trip-item-body';

      const top = document.createElement('div');
      top.className = 'trip-item-top';
      const title = document.createElement('div');
      title.className = 'trip-item-title';
      title.textContent = trip.title;
      const date = document.createElement('div');
      date.className = 'trip-item-date';
      date.textContent = trip.dateLabel || trip.year || '';
      top.append(title, date);

      const place = document.createElement('div');
      place.className = 'trip-item-place';
      place.textContent = trip.place;

      const note = document.createElement('div');
      note.className = 'trip-item-note';
      note.textContent = trip.note || '';

      const tags = document.createElement('div');
      tags.className = 'trip-item-tags';
      normalizeTags(trip).forEach((tag) => {
        const span = document.createElement('span');
        span.textContent = tag;
        tags.append(span);
      });

      body.append(top, place, note, tags);
      button.append(media, body);
      button.addEventListener('click', () => selectTrip(trip.id));
      tripListEl.append(button);
    });
  };

  const renderRoute = (visibleTrips) => {
    if (window.tripRouteLayer) {
      map.removeLayer(window.tripRouteLayer);
      window.tripRouteLayer = null;
    }

    const routePoints = visibleTrips
      .slice()
      .sort((a, b) => String(a.sortDate || a.year || '').localeCompare(String(b.sortDate || b.year || '')))
      .map((trip) => trip.coords);

    if (routePoints.length >= 2) {
      window.tripRouteLayer = L.polyline(routePoints, {
        color: '#2d6644',
        weight: 2,
        opacity: 0.32,
        dashArray: '8 10',
      }).addTo(map);
    }
  };

  const render = () => {
    const visibleTrips = filteredTrips();
    renderList(visibleTrips);
    renderRoute(visibleTrips);
    updateMarkers(visibleTrips);
    setActiveFilterUI();

    if (tripCountEl) {
      tripCountEl.textContent = `${visibleTrips.length} trip${visibleTrips.length === 1 ? '' : 's'}`;
    }

    if (statusEl) {
      const queryText = searchTerm.trim();
      statusEl.textContent = activeYear === 'all' && !queryText
        ? `${visibleTrips.length} trip${visibleTrips.length === 1 ? '' : 's'} loaded.`
        : `${visibleTrips.length} trip${visibleTrips.length === 1 ? '' : 's'} match the filters.`;
    }

    if (!visibleTrips.some((trip) => trip.id === selectedId)) {
      const nextTrip = visibleTrips[0] || null;
      if (nextTrip) {
        selectedId = nextTrip.id;
        updateDetail(nextTrip);
        updateOverlay(nextTrip);
      }
    }

    if (visibleTrips.length) {
      const focusTrip = trips.find((trip) => trip.id === selectedId) || visibleTrips[0];
      if (focusTrip) {
        const visibleBounds = L.latLngBounds(visibleTrips.map((trip) => trip.coords));
        map.fitBounds(visibleBounds.pad(0.18), { animate: !reducedMotion });
        const activeCard = document.querySelector(`.trip-item[data-trip-id="${focusTrip.id}"]`);
        document.querySelectorAll('.trip-item').forEach((card) => card.classList.toggle('is-active', card === activeCard));
      }
    }
  };

  const syncFromHash = () => {
    const id = location.hash.replace('#', '');
    if (trips.some((trip) => trip.id === id)) {
      selectTrip(id, { panTo: true });
    }
  };

  searchEl?.addEventListener('input', () => {
    searchTerm = searchEl.value || '';
    render();
  });

  resetBtn?.addEventListener('click', () => {
    activeYear = 'all';
    searchTerm = '';
    if (searchEl) searchEl.value = '';
    render();
  });

  window.addEventListener('hashchange', syncFromHash);

  try {
    trips = await loadTrips();
    if (!trips.length) throw new Error('No trips available.');

    trips.forEach((trip) => {
      const marker = L.marker(trip.coords, { icon: pinIcon(false) }).addTo(map);
      marker.bindPopup(createPopup(trip), {
        closeButton: false,
        offset: [0, -8],
      });
      marker.on('click', () => selectTrip(trip.id));
      markers.set(trip.id, marker);
    });

    buildYearFilters();
    updateOverlay(trips[0]);
    updateDetail(trips[0]);
    render();

    const initialId = location.hash.replace('#', '');
    if (initialId && trips.some((trip) => trip.id === initialId)) {
      selectTrip(initialId, { panTo: true });
    } else {
      map.fitBounds(L.latLngBounds(trips.map((trip) => trip.coords)).pad(0.18), { animate: false });
    }
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = 'Unable to load trip data.';
    tripListEl.innerHTML = '<div class="trip-empty">Trip data could not be loaded.</div>';
  }
})();