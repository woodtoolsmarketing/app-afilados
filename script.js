const WHATSAPP_NUMBER = "5491134609057";

let orderData = {
  isClient: false,
  clientNumber: '',
  service: '',
  tool: '',
  quantity: 1,
  address: ''
};

let historyStack = ['screen-client'];

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  
  if(screenId !== historyStack[historyStack.length - 1]) {
    historyStack.push(screenId);
  }
  
  let hideBackBtn = ['screen-client', 'screen-welcome', 'screen-success'].includes(screenId);
  document.getElementById('bottom-bar').style.display = hideBackBtn ? 'none' : 'flex';
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
        <label>DNI</label>
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
  goTo('screen-welcome');
}

function setService(serviceType) {
  orderData.service = serviceType;
  document.getElementById('tools-title').innerText = `Herramienta a ${serviceType}`;
  goTo('screen-tools');
}

function selectTool(toolName) {
  orderData.tool = toolName;
  document.getElementById('selected-tool-name').innerText = toolName;
  document.getElementById('input-qty').value = 1;
  goTo('screen-quantity');
}

function saveQuantity() {
  let qty = document.getElementById('input-qty').value;
  if(qty < 1) { alert("Ingresá una cantidad válida"); return; }
  orderData.quantity = qty;
  goTo('screen-logistics');
}

function checkZone() {
  let address = document.getElementById('input-address').value;
  if(!address) { alert("Por favor ingresá tu dirección"); return; }
  orderData.address = address;
  
  let alertBox = document.getElementById('zone-alert');
  if(address.toLowerCase().includes("interior") || address.toLowerCase().includes("ruta")) {
    alertBox.className = "alert alert-warning";
    alertBox.innerText = "Estás fuera de zona. Opciones de envío: Via Cargo / Credifin.";
  } else {
    alertBox.className = "alert alert-info";
    alertBox.innerText = "¡Perfecto! El afilador pasa por tu zona.";
  }
  
  goTo('screen-payment');
}

function finishOrder() {
  let invoice = document.getElementById('input-invoice').value;
  let payment = document.getElementById('input-paymethod').value;
  
  let tipoCliente = orderData.isClient ? `Cliente Existente (Nro: ${orderData.clientNumber})` : "Nuevo Cliente";

  let textMessage = `*NUEVO PEDIDO DE SERVICIO* 🛠️\n\n` +
                    `*Cliente:* ${tipoCliente}\n` +
                    `*Servicio:* ${orderData.service}\n` +
                    `*Herramienta:* ${orderData.tool}\n` +
                    `*Cantidad:* ${orderData.quantity}\n` +
                    `*Retiro en:* ${orderData.address}\n` +
                    `*Factura:* ${invoice}\n` +
                    `*Pago:* ${payment}\n\n` +
                    `_Enviado desde la App de Wood Tools SRL_`;

  let encodedMessage = encodeURIComponent(textMessage);
  let url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
  goTo('screen-success');
}

function startChat(motivo) {
  let textMessage = `Hola, necesito consultar sobre: *${motivo}*`;
  let encodedMessage = encodeURIComponent(textMessage);
  let url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
}