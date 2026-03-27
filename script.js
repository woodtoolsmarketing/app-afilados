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

// Arreglo para manejar múltiples productos
let cart = [];

let historyStack = ['screen-client'];

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  if(screenId !== historyStack[historyStack.length - 1]) {
    historyStack.push(screenId);
  }
  
  let hideBackBtn = ['screen-client', 'screen-welcome', 'screen-success'].includes(screenId);
  document.getElementById('bottom-bar').style.display = hideBackBtn ? 'none' : 'flex';

  // Renderizar mapa si entra a la logística
  if(screenId === 'screen-logistics') {
    setTimeout(() => {
      if(map) {
        google.maps.event.trigger(map, 'resize');
        map.setCenter(marker.getPosition());
      }
    }, 100);
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

// SISTEMA DE CARRITO
function saveQuantity() {
  let qty = parseInt(document.getElementById('input-qty').value);
  if(qty < 1) { alert("Ingresá una cantidad válida"); return; }
  
  // Agregar al arreglo del carrito
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
  if(cart.length === 0) {
    goTo('screen-service');
  }
}

// GOOGLE MAPS Y UBICACIÓN
let map, marker, geocoder, autocomplete;

function initMap() {
  // Centro por defecto: Avellaneda, Buenos Aires
  const defaultLoc = { lat: -34.662, lng: -58.365 }; 
  
  // Solo iniciar si la API está cargada (evita errores si falta la Key)
  if(typeof google === 'undefined') return;

  map = new google.maps.Map(document.getElementById("map-container"), {
    zoom: 13, 
    center: defaultLoc,
    disableDefaultUI: true
  });
  
  marker = new google.maps.Marker({ map: map, position: defaultLoc, draggable: true });
  geocoder = new google.maps.Geocoder();

  const input = document.getElementById("input-address");
  autocomplete = new google.maps.places.Autocomplete(input);
  
  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      map.setCenter(place.geometry.location);
      map.setZoom(15);
      marker.setPosition(place.geometry.location);
      orderData.coordinates = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    }
  });

  // Permitir mover el marcador manualmente
  marker.addListener("dragend", () => {
    orderData.coordinates = { lat: marker.getPosition().lat(), lng: marker.getPosition().lng() };
    geocodePosition(marker.getPosition());
  });
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      if(map) {
        map.setCenter(pos);
        map.setZoom(16);
        marker.setPosition(pos);
      }
      orderData.coordinates = pos;
      geocodePosition(pos);
    }, () => {
      alert("No se pudo obtener la ubicación. Revisá los permisos de tu navegador.");
    });
  } else {
    alert("Tu navegador no soporta geolocalización.");
  }
}

function geocodePosition(pos) {
  if(!geocoder) return;
  geocoder.geocode({ location: pos }, (results, status) => {
    if (status === "OK" && results[0]) {
      document.getElementById("input-address").value = results[0].formatted_address;
    }
  });
}

// Iniciar mapa en la carga de la página si es posible
window.onload = () => {
  if(typeof google !== 'undefined') initMap();
};

function goToLogistics() {
  if(cart.length === 0) { alert("Tu carrito está vacío"); return; }
  goTo('screen-logistics');
}

function checkZone() {
  let address = document.getElementById('input-address').value;
  if(!address) { alert("Por favor ingresá tu dirección o usá tu ubicación actual en el mapa."); return; }
  orderData.address = address;
  
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

// SIMULACIÓN DE CONEXIÓN CON SOFTWARE DE VENDEDORES (BACKEND)
function finishOrder() {
  let btn = document.getElementById('btn-finish');
  btn.innerText = "Enviando al sistema...";
  btn.disabled = true;

  let invoice = document.getElementById('input-invoice').value;
  let payment = document.getElementById('input-paymethod').value;
  
  // Objeto JSON listo para ser consumido por un backend/API
  let payloadBackend = {
    cliente: {
      tipo: orderData.isClient ? "Existente" : "Nuevo",
      numero: orderData.clientNumber || "N/A"
    },
    pedidos: cart,
    logistica: {
      direccion: orderData.address,
      coordenadas: orderData.coordinates
    },
    facturacion: {
      requiere_factura: invoice,
      metodo_pago: payment
    }
  };

  console.log("--> ENVIANDO DATOS A LA API DEL SISTEMA COMERCIAL <--");
  console.log(JSON.stringify(payloadBackend, null, 2));

  // Simulamos el tiempo de respuesta del servidor (1.5 segundos)
  setTimeout(() => {
    btn.innerText = "Confirmar Pedido (Enviar a Sistema)";
    btn.disabled = false;
    cart = []; // Vaciar carrito
    goTo('screen-success');
  }, 1500);
}

function startChat(motivo) {
  let textMessage = `Hola, necesito consultar sobre: *${motivo}*`;
  let encodedMessage = encodeURIComponent(textMessage);
  let url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
}