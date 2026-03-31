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
let historyStack = ['screen-client'];
let mapInitialized = false;

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  if(screenId !== historyStack[historyStack.length - 1]) {
    historyStack.push(screenId);
  }
  
  let hideBackBtn = ['screen-client', 'screen-welcome', 'screen-success'].includes(screenId);
  document.getElementById('bottom-bar').style.display = hideBackBtn ? 'none' : 'flex';

  if(screenId === 'screen-logistics') {
    renderAddressHistory();
    setTimeout(() => {
      if(!mapInitialized) {
          initMap();
      } else if(map) {
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

function setClient(isClient) {
  orderData.isClient = isClient;
  const fieldsDiv = document.getElementById('client-fields');
  const actionDiv = document.getElementById('client-action');
  const title = document.getElementById('client-title');
  
  if(isClient) {
    title.innerText = "Ingresá tus datos";
    fieldsDiv.innerHTML = `
      <div class="form-group">
        <label>DNI o CUIT</label>
        <input type="text" id="login-dni" placeholder="Ingresá tu DNI...">
      </div>
      <div class="form-group">
        <label>Teléfono</label>
        <input type="text" id="login-tel" placeholder="Ingresá tu número...">
      </div>
      <div class="checkbox-group">
        <input type="checkbox" id="login-remember">
        <label for="login-remember">Recordar usuario</label>
      </div>
    `;
    actionDiv.innerHTML = `<button class="btn btn-primary" onclick="loginUser()">Continuar</button>`;
  } else {
    title.innerText = "Alta de Nuevo Cliente";
    fieldsDiv.innerHTML = `
      <div class="form-group"><input type="text" placeholder="Razón Social / Nombre"></div>
      <div class="form-group"><input type="text" placeholder="CUIT / CUIL"></div>
      <div class="form-group"><input type="text" placeholder="Teléfono / WhatsApp"></div>
      <div class="form-group"><input type="text" placeholder="Localidad / Provincia"></div>
    `;
    actionDiv.innerHTML = `<button class="btn btn-primary" onclick="goTo('screen-service')">Continuar</button>`;
  }
  goTo('screen-client-data');
}

function loginUser() {
  let dni = document.getElementById('login-dni').value;
  if(!dni || dni.length < 6) { alert("Por favor, ingresá un DNI válido"); return; }
  
  let lastDigits = dni.slice(-4);
  orderData.clientNumber = `WT-${lastDigits}`;
  
  document.getElementById('display-client-number').innerText = `Nro de cliente: ${orderData.clientNumber}`;
  
  let headerClientNumber = document.getElementById('header-client-number');
  headerClientNumber.innerText = `Nro de cliente: ${orderData.clientNumber}`;
  headerClientNumber.style.display = 'block';

  goTo('screen-welcome');
}

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

  renderCart();
  goTo('screen-cart');
}

function renderCart() {
  const container = document.getElementById('cart-container');
  container.innerHTML = '';

  if(cart.length === 0) {
    container.innerHTML = '<p style="text-align:center; color: var(--muted);">El carrito está vacío.</p>';
    return;
  }

  cart.forEach((item, index) => {
    let itemHtml = `
      <div class="cart-item">
        <div class="cart-item-details">
          <span class="cart-item-tool">${item.tool}</span>
          <span class="cart-item-qty">${item.service} - Cantidad: ${item.quantity}</span>
        </div>
        <button class="btn-remove" onclick="removeFromCart(${index})">✖</button>
      </div>
    `;
    container.innerHTML += itemHtml;
  });
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
  if(cart.length === 0) goTo('screen-service');
}

function goToLogistics() {
  if(cart.length === 0) { alert("Tu carrito está vacío"); return; }
  goTo('screen-logistics');
}

// ----------------------------------------------------
// GOOGLE MAPS CLÁSICO Y ESTABLE
// ----------------------------------------------------
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
      
      const defaultLoc = { lat: -34.662, lng: -58.365 }; // Avellaneda

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

// --- ACÁ ESTÁ LA MAGIA DEL GPS DE ALTA PRECISIÓN ---
function getUserLocation() {
  if (navigator.geolocation) {
    // Le pedimos al celular que encienda el GPS real y no use datos cacheados
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        if(map) {
          map.setCenter(pos); 
          map.setZoom(18); // Zoom más cerca (18 en vez de 16) para ver la casa exacta
          marker.position = pos;
        }
        orderData.coordinates = pos;
        geocodePosition(pos);
      }, 
      (error) => { 
        console.error("Error de GPS:", error);
        alert("No se pudo obtener la ubicación exacta. Asegurate de tener el GPS (Ubicación) encendido en tu celular y darle permisos a la página."); 
      },
      options // Pasamos la configuración estricta
    );
  } else {
    alert("Tu navegador no soporta geolocalización.");
  }
}

// ----------------------------------------------------
// MANEJO DE HISTORIAL LOCAL DE DIRECCIONES
// ----------------------------------------------------
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

function checkZone() {
  let address = document.getElementById('input-address').value;
  
  if(!address || address.trim() === "") { 
      alert("Por favor ingresá tu dirección o ubicá el pin en el mapa."); 
      return; 
  }
  
  orderData.address = address;
  saveAddressToHistory(orderData.address, orderData.coordinates);
  
  let alertBox = document.getElementById('zone-alert');
  if(address.toLowerCase().includes("interior") || address.toLowerCase().includes("ruta") || address.toLowerCase().includes("provincia")) {
    alertBox.className = "alert alert-warning";
    alertBox.innerText = "Estás fuera de zona. Opciones de envío: Via Cargo / Credifin.";
  } else {
    alertBox.className = "alert alert-info";
    alertBox.innerText = "¡Perfecto! El afilador pasa por tu zona.";
  }
  goTo('screen-payment');
}

function finishOrder() {
  let btn = document.getElementById('btn-finish');
  btn.innerText = "Enviando al sistema...";
  btn.disabled = true;

  let invoice = document.getElementById('input-invoice').value;
  let payment = document.getElementById('input-paymethod').value;
  
  let payloadBackend = {
    cliente: { tipo: orderData.isClient ? "Existente" : "Nuevo", numero: orderData.clientNumber || "N/A" },
    pedidos: cart,
    logistica: { direccion: orderData.address, coordenadas: orderData.coordinates },
    facturacion: { requiere_factura: invoice, metodo_pago: payment }
  };

  console.log("--> ENVIANDO DATOS A LA API DEL SISTEMA COMERCIAL <--");
  console.log(JSON.stringify(payloadBackend, null, 2));

  setTimeout(() => {
    btn.innerText = "Confirmar Pedido (Enviar a Sistema)";
    btn.disabled = false;
    cart = []; 
    goTo('screen-success');
  }, 1500);
}

function startChat(motivo) {
  let textMessage = `Hola, necesito consultar sobre: *${motivo}*`;
  let encodedMessage = encodeURIComponent(textMessage);
  let url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  window.open(url, '_blank');
}