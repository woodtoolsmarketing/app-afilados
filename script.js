const WHATSAPP_NUMBER = "5491134609057";

let orderData = {
  isClient: false,
  clientNumber: '',
  service: '',
  tool: '',
  quantity: 1,
  address: '',
  coordinates: null
};

let cart = [];
let historyStack = ['screen-landing'];
let mapInitialized = false;

// ------------------- NAVEGACIÓN Y MENÚ -------------------
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  if(screenId !== historyStack[historyStack.length - 1]) {
    historyStack.push(screenId);
  }
  
  // Mostrar/Ocultar Header Principal
  const showHeader = !['screen-landing', 'screen-login', 'screen-register', 'screen-forgot', 'screen-biometric'].includes(screenId);
  document.getElementById('main-header').style.display = showHeader ? 'block' : 'none';

  // Botón Volver
  let hideBackBtn = ['screen-landing', 'screen-service', 'screen-success'].includes(screenId);
  document.getElementById('bottom-bar').style.display = hideBackBtn ? 'none' : 'flex';

  if(screenId === 'screen-logistics') {
    renderAddressHistory();
    setTimeout(() => {
      if(!mapInitialized) { initMap(); } 
      else if(map) {
         google.maps.event.trigger(map, 'resize');
         if(marker && marker.position) map.setCenter(marker.position);
      }
    }, 200);
  }
}

function goBack() {
  if(historyStack.length > 1) {
    historyStack.pop();
    let prevScreen = historyStack.pop();
    goTo(prevScreen);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

function updateGlobalClientNumber(number) {
  orderData.clientNumber = number;
  document.getElementById('header-client-number').innerText = `Nro de cliente: ${number}`;
  document.getElementById('sidebar-client-number').innerText = `Nro de cliente: ${number}`;
}

function resetApp() {
  cart = [];
  document.getElementById('cart-badge').innerText = "0";
  goTo('screen-service');
}

// ------------------- AUTENTICACIÓN -------------------
function doLogin() {
  let dni = document.getElementById('login-dni').value;
  if(!dni || dni.length < 6) { alert("Por favor, ingresá un DNI válido"); return; }
  let lastDigits = dni.slice(-4);
  updateGlobalClientNumber(`WT-${lastDigits}`);
  goTo('screen-service');
}

function doRegister() {
  let dni = document.getElementById('reg-dni').value;
  let nombre = document.getElementById('reg-nombre').value;
  if(!dni || !nombre) { alert("Completá los campos principales"); return; }
  let randomNum = Math.floor(1000 + Math.random() * 9000);
  updateGlobalClientNumber(`WT-${randomNum}`);
  goTo('screen-service');
}

function sendRecovery() {
  let email = document.getElementById('forgot-email').value;
  if(!email) { alert("Ingresá un correo."); return; }
  alert(`Link de recuperación enviado a ${email}`);
  goTo('screen-login');
}

function simulateBiometric() {
  const icon = document.querySelector('.bio-icon');
  icon.classList.add('bio-pulse');
  setTimeout(() => {
    icon.classList.remove('bio-pulse');
    document.getElementById('bio-scan-area').style.display = 'none';
    document.getElementById('bio-success-area').style.display = 'block';
  }, 1500);
}

function sendBackupRecovery() {
  let email = document.getElementById('new-backup-email').value;
  if(!email) { alert("Ingresá un nuevo correo."); return; }
  alert(`Link de configuración enviado a ${email}`);
  goTo('screen-login');
}

// ------------------- FLUJO DE SERVICIO -------------------
function setService(serviceType) {
  orderData.service = serviceType;
  document.getElementById('tools-title').innerText = `Herramienta a ${serviceType}`;
  goTo('screen-tools');
}

function selectTool(toolName) {
  orderData.tool = toolName;
  document.getElementById('selected-tool-name').innerText = `${orderData.service} - ${toolName}`;
  document.getElementById('input-qty').value = 1;
  goTo('screen-quantity');
}

function saveQuantity() {
  let qty = parseInt(document.getElementById('input-qty').value);
  if(qty < 1) { alert("Ingresá una cantidad válida"); return; }
  
  cart.push({
    service: orderData.service,
    tool: orderData.tool,
    quantity: qty
  });

  document.getElementById('cart-badge').innerText = cart.length;
  renderCart();
  goTo('screen-service'); // Vuelve al menú para seguir agregando, o puede ir al carrito manual
  alert("Agregado al carrito");
}

function renderCart() {
  const container = document.getElementById('cart-container');
  container.innerHTML = '';

  if(cart.length === 0) {
    container.innerHTML = '<p style="text-align:center; color: var(--muted);">El carrito está vacío.</p>';
    return;
  }

  cart.forEach((item, index) => {
    let itemHtml = `<div class="cart-item-row">${item.quantity} - ${item.tool} (${item.service})</div>`;
    container.innerHTML += itemHtml;
  });
}

function cancelCart() {
  cart = [];
  document.getElementById('cart-badge').innerText = "0";
  goTo('screen-service');
}

function goToLogistics() {
  if(cart.length === 0) { alert("Tu carrito está vacío"); return; }
  goTo('screen-logistics');
}

// ------------------- MAPAS Y LOGÍSTICA -------------------
let map, marker, geocoder, autocomplete;

async function initMap() {
  if (typeof google === 'undefined' || !google.maps) {
      console.error("Google Maps API no está cargada.");
      return;
  }

  try {
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      const { Geocoder } = await google.maps.importLibrary("geocoding");
      const { Autocomplete } = await google.maps.importLibrary("places"); 
      
      const defaultLoc = { lat: -34.662, lng: -58.365 }; 

      map = new Map(document.getElementById("map-container"), {
        zoom: 14, 
        center: defaultLoc, 
        disableDefaultUI: true,
        mapId: "DEMO_MAP_ID" 
      });

      marker = new AdvancedMarkerElement({
        map: map,
        position: defaultLoc,
        gmpDraggable: true
      });
      
      geocoder = new Geocoder();
      const input = document.getElementById("input-address");
      
      autocomplete = new Autocomplete(input, {
          componentRestrictions: { country: "ar" },
          fields: ["formatted_address", "geometry", "name"],
          strictBounds: false
      });
      
      autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          
          if (place.geometry) {
              map.setCenter(place.geometry.location);
              map.setZoom(16);
              marker.position = place.geometry.location;
              
              orderData.coordinates = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
              orderData.address = place.formatted_address || input.value;
              
              if (place.formatted_address) {
                  input.value = place.formatted_address;
              }
          } else {
              geocodeAddress(input.value);
          }
      });
      
      input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
              e.preventDefault();
              geocodeAddress(input.value);
          }
      });

      map.addListener("click", (event) => {
        const clickedLoc = event.latLng;
        marker.position = clickedLoc;
        map.panTo(clickedLoc);
        orderData.coordinates = { lat: clickedLoc.lat(), lng: clickedLoc.lng() };
        geocodePosition(clickedLoc);
      });

      marker.addListener("dragend", () => {
        orderData.coordinates = { lat: marker.position.lat, lng: marker.position.lng };
        geocodePosition(marker.position);
      });

      mapInitialized = true;

  } catch(e) {
      console.error("Hubo un error inicializando el mapa: ", e);
  }
}

function geocodePosition(pos) {
  if(!geocoder) return;
  geocoder.geocode({ location: pos }, (results, status) => {
    if (status === "OK" && results[0]) {
      document.getElementById("input-address").value = results[0].formatted_address;
      orderData.address = results[0].formatted_address;
    }
  });
}

function geocodeAddress(address) {
    if(!geocoder) return;
    const fullSearch = address.includes("Argentina") ? address : `${address}, Buenos Aires, Argentina`;

    geocoder.geocode({ address: fullSearch }, (results, status) => {
        if (status === "OK" && results[0]) {
            const loc = results[0].geometry.location;
            map.setCenter(loc);
            map.setZoom(16);
            marker.position = loc;
            
            document.getElementById("input-address").value = results[0].formatted_address;
            orderData.address = results[0].formatted_address;
            orderData.coordinates = { lat: loc.lat(), lng: loc.lng() };
        } else {
            alert("No encontramos esa dirección. Intentá ubicar el pin en el mapa.");
        }
    });
}

function getUserLocation() {
  if (navigator.geolocation) {
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        if(map) {
          map.setCenter(pos); 
          map.setZoom(18); 
          marker.position = pos;
        }
        orderData.coordinates = pos;
        geocodePosition(pos);
      }, 
      (error) => { alert("Asegurate de tener el GPS encendido."); },
      options
    );
  } else {
    alert("Tu navegador no soporta geolocalización.");
  }
}

function saveAddressToHistory(address, coords) {
  if (!address || address.trim() === "") return;
  let history = JSON.parse(localStorage.getItem('addressHistoryWT')) || [];
  history = history.filter(item => item.address !== address);
  history.unshift({ address, coords });
  if (history.length > 3) history.pop(); 
  localStorage.setItem('addressHistoryWT', JSON.stringify(history));
}

function renderAddressHistory() {
  let history = JSON.parse(localStorage.getItem('addressHistoryWT')) || [];
  const container = document.getElementById('address-history');
  const list = document.getElementById('history-list');
  
  if (history.length > 0) {
    container.style.display = 'block';
    list.innerHTML = '';
    history.forEach(item => {
      let btn = document.createElement('div');
      btn.className = 'history-btn';
      btn.innerHTML = `<span>🕒</span> ${item.address}`;
      btn.onclick = () => {
        document.getElementById('input-address').value = item.address;
        orderData.address = item.address;
        if(item.coords && typeof google !== 'undefined' && map && marker) {
          map.setCenter(item.coords);
          map.setZoom(16);
          marker.position = item.coords;
          orderData.coordinates = item.coords;
        }
      };
      list.appendChild(btn);
    });
  } else {
    container.style.display = 'none';
  }
}

function finishOrder() {
  let address = document.getElementById('input-address').value;
  if(!address || address.trim() === "") { alert("Ingresá tu dirección."); return; }
  
  orderData.address = address;
  saveAddressToHistory(orderData.address, orderData.coordinates);

  let btn = document.getElementById('btn-finish');
  btn.innerText = "Enviando al sistema...";
  btn.disabled = true;
  
  let payloadBackend = {
    cliente: { numero: orderData.clientNumber },
    pedidos: cart,
    logistica: { direccion: orderData.address, coordenadas: orderData.coordinates }
  };

  console.log("--> ENVIANDO DATOS A LA API DEL SISTEMA COMERCIAL <--");
  console.log(JSON.stringify(payloadBackend, null, 2));

  setTimeout(() => {
    btn.innerText = "Confirmar Ubicación";
    btn.disabled = false;
    goTo('screen-success');
  }, 1500);
}

function startChat(motivo) {
  let textMessage = `Hola, soy el cliente ${orderData.clientNumber || 'Nuevo'}. Necesito consultar sobre: *${motivo}*`;
  let encodedMessage = encodeURIComponent(textMessage);
  let url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  window.open(url, '_blank');
}