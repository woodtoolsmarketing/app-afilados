/* ==========================================================================
   Afilador digital WoodTools — lógica de la app
   ========================================================================== */

const WHATSAPP_NUMBER = "5491134609057";
const VENDORS = ["Martín", "Lucas", "Diego", "Sofía"];

/* Catálogo de herramientas.
   type: 'sierra'  -> cantidad + cantidad de dientes + modelo (texto)
         'mechas'  -> cantidad + modelo (dropdown animado)
         'simple'  -> cantidad + modelo (texto)                              */
const IMG = 'imagenes/Herramientas/';
const TOOLS = [
  { id:'melamina',  name:'Sierras para melamina', article:'la sierra',      type:'sierra', img:IMG+'SC%20melamina.png' },
  { id:'madera',    name:'Sierras para madera',   article:'la sierra',      type:'sierra', img:IMG+'SC%20madera.png' },
  { id:'fresas',    name:'Fresas',                article:'la fresa',       type:'simple', img:IMG+'Fresa.png' },
  { id:'cuchillas', name:'Cuchillas',             article:'la cuchilla',    type:'simple', img:IMG+'Cuchillas.png' },
  { id:'mechas',    name:'Mechas',                article:'la mecha',       type:'mechas', img:IMG+'Mechas.png' },
  { id:'cabezales', name:'Cabezales',             article:'el cabezal',     type:'simple', img:IMG+'Cabezales.png' },
  { id:'multiple',  name:'Sierras para múltiple', article:'la sierra',      type:'sierra', img:IMG+'SC%20Franzoi.png' },
  { id:'diamante',  name:'Diamante',              article:'la herramienta', type:'simple', img:IMG+'Diamante.png' },
];

const MECHA_MODELS = [
  "Mecha para pasante",
  "Mecha para ciego",
  "Mecha tipo bisagra (Ø35)",
  "Mecha helicoidal HSS",
  "Mecha para CNC",
  "Mecha punta de widia",
];

const SERVICE_LABEL = { afilado:'AFILADO', reparacion:'REPARACIÓN' };

let orderData = { clientNumber:'', address:'', coordinates:null };
let cart = [];
let historyStack = ['screen-landing'];
let current = { service:'afilado', tool:null, draft:{} };

/* ==========================  NAVEGACIÓN  ================================= */
const TOP_LEVEL   = ['screen-landing','screen-login','screen-register','screen-forgot','screen-service','screen-success'];
const NO_HEADER   = ['screen-landing','screen-login','screen-register','screen-forgot'];
const CART_SCREENS= ['screen-detail','screen-cart','screen-logistics'];

function goTo(screenId, skipHistory){
  const target = document.getElementById(screenId);
  if(!target) return;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  target.classList.add('active');
  document.getElementById('screens').scrollTop = 0;

  if(!skipHistory && screenId !== historyStack[historyStack.length-1]) historyStack.push(screenId);

  const app = document.getElementById('app');
  const showHeader = !NO_HEADER.includes(screenId);
  const header = document.getElementById('main-header');
  header.hidden = !showHeader;
  app.classList.toggle('has-header', showHeader);

  document.getElementById('cart-btn').hidden = !CART_SCREENS.includes(screenId);
  // barra "Volver": visible en pantallas que no son de nivel superior
  document.getElementById('back-bar').hidden = TOP_LEVEL.includes(screenId);

  if(screenId === 'screen-logistics') openLogistics();
}

function goBack(){
  if(historyStack.length > 1){
    historyStack.pop();
    const prev = historyStack[historyStack.length-1];
    goTo(prev, true);
  } else {
    goTo('screen-service', true);
  }
}

/* ==========================  SIDEBAR  =================================== */
function openSidebar(){
  const sb = document.getElementById('sidebar');
  sb.classList.add('open');
  sb.setAttribute('aria-hidden','false');
  sb.removeAttribute('inert');          // focusable sólo cuando está abierto
  document.getElementById('sidebar-overlay').classList.add('show');
}
function closeSidebar(){
  const sb = document.getElementById('sidebar');
  sb.classList.remove('open');
  sb.setAttribute('aria-hidden','true');
  sb.setAttribute('inert','');          // fuera del orden de tabulación al cerrar
  document.getElementById('sidebar-overlay').classList.remove('show');
}
function navFromMenu(dest){
  closeSidebar();
  setTimeout(() => {
    if(dest === 'afilado' || dest === 'reparacion') startService(dest);
    else goTo(dest);
  }, 180);
}
function sbInfo(t){ closeSidebar(); setTimeout(()=>alert(`${t}: sección en construcción.`),180); return false; }

/* ==========================  AUTENTICACIÓN  ============================= */
function setClientNumber(n){ orderData.clientNumber = n; }

function doLogin(){
  const user = document.getElementById('login-user').value.trim();
  if(user.length < 4){ alert('Ingresá tu usuario o CUIT.'); return; }
  setClientNumber('WT-' + user.slice(-4).padStart(4,'0'));
  goTo('screen-service');
}
function doRegister(){
  const name = document.getElementById('reg-name').value.trim();
  const doc  = document.getElementById('reg-doc').value.trim();
  const p1   = document.getElementById('reg-pass').value;
  const p2   = document.getElementById('reg-pass2').value;
  if(!name || !doc){ alert('Completá nombre y CUIT/DNI.'); return; }
  if(p1 !== p2){ alert('Las contraseñas no coinciden.'); return; }
  const addr = document.getElementById('reg-address').value.trim();
  if(addr) localStorage.setItem('wt_saved_address', addr);
  setClientNumber('WT-' + Math.floor(1000 + Math.random()*9000));
  goTo('screen-service');
}
function sendRecovery(){
  const email = document.getElementById('forgot-email').value.trim();
  if(!email){ alert('Ingresá un correo.'); return; }
  alert(`Te enviamos un enlace de recuperación a ${email}.`);
  goTo('screen-login', true); historyStack = ['screen-landing','screen-login'];
}
function toggleShipping(){
  const f = document.getElementById('reg-ship-field');
  const show = f.hidden;
  f.hidden = !show;
  if(show) setupAddressField('reg-ship','reg-ship-map');
}

/* ==========================  FLUJO DE SERVICIO  ========================= */
function startService(service){
  current.service = service;
  renderToolsGrid();
  goTo('screen-tools');
}

function renderToolsGrid(){
  document.getElementById('tools-title').textContent = SERVICE_LABEL[current.service];
  document.getElementById('tools-subtitle').textContent =
    current.service === 'afilado' ? '¿Que necesitas afilar?' : '¿Que necesitas reparar?';
  const grid = document.getElementById('tools-grid');
  grid.innerHTML = '';
  TOOLS.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.onclick = () => selectTool(t.id);
    card.innerHTML = `<span class="tool-name">${t.name}</span>` +
      (t.img ? `<img class="tool-photo" src="${t.img}" alt="${t.name}" loading="lazy" onerror="this.remove()">` : '');
    grid.appendChild(card);
  });
}

function selectTool(id){
  current.tool = TOOLS.find(t => t.id === id);
  current.draft = {};
  renderDetail();
  goTo('screen-detail');
}

/* ----- Render dinámico del detalle según herramienta y servicio -------- */
function renderDetail(){
  const t = current.tool, s = current.service;
  current.dirty = false;          // formulario recién generado = sin cambios
  current.draft = {};             // evita arrastrar el modelo elegido antes
  document.getElementById('detail-title').textContent = SERVICE_LABEL[s];
  document.getElementById('detail-tool').textContent = t.name;
  const photo = document.getElementById('detail-photo');
  if(t.img){ photo.src = t.img; photo.hidden = false; } else { photo.hidden = true; }
  const box = document.getElementById('detail-fields');
  box.innerHTML = '';

  // Cantidad (siempre)
  box.appendChild(fieldHTML(`Cantidad de ${t.name.toLowerCase()}`,
    `<input type="number" min="1" value="1" id="d-qty" class="box-input half" inputmode="numeric">`, 'd-qty'));

  // Sierras -> cantidad de dientes
  if(t.type === 'sierra'){
    const label = s === 'reparacion' ? 'Cantidad de dientes a reparar' : 'Cantidad de dientes';
    const wrap = fieldHTML(label, `<input type="number" min="0" id="d-teeth" class="box-input half" inputmode="numeric">`, 'd-teeth');
    if(s === 'reparacion'){
      const link = document.createElement('a');
      link.href = '#'; link.className = 'field-link';
      link.textContent = '¿Queres comprar una nueva?';
      link.onclick = (e)=>{ e.preventDefault(); openWhatsApp(`Quiero comprar una ${t.name} nueva`); };
      wrap.appendChild(link);
    }
    box.appendChild(wrap);
  }

  // Modelo
  if(t.type === 'mechas'){
    box.appendChild(buildCustomSelect(`Modelo de ${t.name.toLowerCase()}`, MECHA_MODELS));
  } else {
    box.appendChild(fieldHTML(`Modelo de ${t.name.toLowerCase()}`,
      `<input type="text" id="d-model" class="box-input" placeholder="Ej: marca / medida">`, 'd-model'));
  }
}

function fieldHTML(labelText, innerHTML, forId){
  const div = document.createElement('div');
  div.className = 'field';
  div.innerHTML = `<label${forId ? ` for="${forId}"` : ''}>${labelText}</label>${innerHTML}`;
  return div;
}

/* ----- Dropdown personalizado animado (accesible por teclado) ---------- */
let csSeq = 0;
function buildCustomSelect(labelText, options){
  const uid = 'cs' + (++csSeq);
  const div = document.createElement('div');
  div.className = 'field';
  div.innerHTML = `<label id="${uid}-lbl">${labelText}</label>`;
  const sel = document.createElement('div');
  sel.className = 'cselect';
  sel.innerHTML = `
    <div class="cselect-trigger" role="combobox" tabindex="0" aria-haspopup="listbox"
         aria-expanded="false" aria-labelledby="${uid}-lbl ${uid}-val">
      <span class="cs-value placeholder" id="${uid}-val">Seleccioná un modelo</span>
      <span class="cs-arrow" aria-hidden="true">▾</span>
    </div>
    <ul class="cselect-panel" role="listbox" id="${uid}-list" aria-labelledby="${uid}-lbl" tabindex="-1">
      ${options.map((o,i) => `<li class="cs-option" role="option" id="${uid}-opt${i}" tabindex="-1" aria-selected="false">${o}</li>`).join('')}
    </ul>`;
  const trigger = sel.querySelector('.cselect-trigger');
  const value   = sel.querySelector('.cs-value');
  const opts     = [...sel.querySelectorAll('.cs-option')];
  let activeIdx = -1;

  const open = () => {
    sel.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    activeIdx = Math.max(0, opts.findIndex(o => o.getAttribute('aria-selected') === 'true'));
    focusOption(activeIdx);
  };
  const close = (focusBack) => {
    sel.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    if(focusBack) trigger.focus();
  };
  const focusOption = (i) => {
    if(i < 0 || i >= opts.length) return;
    activeIdx = i;
    opts.forEach(o => o.classList.remove('active'));
    opts[i].classList.add('active');
    opts[i].focus();
    trigger.setAttribute('aria-activedescendant', opts[i].id);
  };
  const choose = (op) => {
    value.textContent = op.textContent;
    value.classList.remove('placeholder');
    opts.forEach(o => o.setAttribute('aria-selected', 'false'));
    op.setAttribute('aria-selected', 'true');
    current.draft.model = op.textContent;
    current.dirty = true;
    close(true);
  };

  trigger.addEventListener('click', () => sel.classList.contains('open') ? close() : open());
  trigger.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown'){ e.preventDefault(); open(); }
    else if(e.key === 'Escape'){ close(); }
  });
  opts.forEach((op, i) => {
    op.addEventListener('click', () => choose(op));
    op.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); choose(op); }
      else if(e.key === 'ArrowDown'){ e.preventDefault(); focusOption(Math.min(opts.length-1, i+1)); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); i === 0 ? (close(true)) : focusOption(i-1); }
      else if(e.key === 'Escape'){ e.preventDefault(); close(true); }
      else if(e.key === 'Tab'){ close(); }
    });
  });
  div.appendChild(sel);
  return div;
}
// Cierra cualquier dropdown abierto al tocar fuera (un solo listener global)
document.addEventListener('click', e => {
  if(!e.target.closest('.cselect'))
    document.querySelectorAll('.cselect.open').forEach(s => {
      s.classList.remove('open');
      const t = s.querySelector('.cselect-trigger');
      if(t) t.setAttribute('aria-expanded', 'false');
    });
});

/* ----- Leer el detalle y armar el ítem -------------------------------- */
function readDetail(){
  const t = current.tool, s = current.service;
  const qty = parseInt(document.getElementById('d-qty')?.value || '0', 10);
  if(!qty || qty < 1){ alert('Ingresá una cantidad válida.'); return null; }

  const item = { service:s, toolId:t.id, tool:t.name, quantity:qty };

  if(t.type === 'sierra'){
    const teeth = document.getElementById('d-teeth')?.value.trim();
    if(teeth) item.teeth = teeth;
  }
  if(t.type === 'mechas'){
    if(!current.draft.model){ alert('Elegí un modelo.'); return null; }
    item.model = current.draft.model;
  } else {
    const m = document.getElementById('d-model')?.value.trim();
    if(m) item.model = m;
  }
  return item;
}

function addToCart(){
  const item = readDetail();
  if(!item) return;
  cart.push(item);
  refreshCartBadge(true);
  flash('Agregado al carrito ✓');
  renderDetail();               // limpia el formulario
}

function nextFromDetail(){
  // Solo agrega el ítem actual si el formulario fue editado (evita duplicar
  // cuando el usuario ya tocó "Agregar al carrito" antes de "Siguiente").
  if(current.dirty){
    const item = readDetail();
    if(!item) return;
    cart.push(item);
    refreshCartBadge(true);
    current.dirty = false;
  }
  if(cart.length === 0){ alert('Agregá al menos una herramienta al carrito.'); return; }
  goToLogistics();
}

/* ==========================  CARRITO  ================================== */
function refreshCartBadge(animate){
  const badge = document.getElementById('cart-badge');
  badge.textContent = cart.length;
  badge.hidden = cart.length === 0;
  if(animate && cart.length){ badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
}

function renderCart(){
  const list = document.getElementById('cart-list');
  list.innerHTML = '';
  document.getElementById('cart-continue').disabled = cart.length === 0;
  if(cart.length === 0){
    list.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
    return;
  }
  cart.forEach((it, i) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    const sub = [SERVICE_LABEL[it.service], it.model, it.teeth ? `${it.teeth} dientes` : null]
      .filter(Boolean).join(' · ');
    row.innerHTML = `
      <div class="ci-main">
        <span class="ci-title">${it.quantity} × ${it.tool}</span>
        <span class="ci-sub">${sub}</span>
      </div>
      <button class="ci-del" aria-label="Quitar">✕</button>`;
    row.querySelector('.ci-del').onclick = () => { cart.splice(i,1); refreshCartBadge(); renderCart(); };
    list.appendChild(row);
  });
}

function goToLogistics(){
  if(cart.length === 0){ alert('Tu carrito está vacío.'); return; }
  goTo('screen-logistics');
}

/* ==========================  LOGÍSTICA  =============================== */
function openLogistics(){
  const services = [...new Set(cart.map(it => it.service))];
  const totalUnits = cart.reduce((n, it) => n + it.quantity, 0);
  // Título: si todo el carrito es del mismo servicio lo mostramos; si no, "PEDIDO"
  document.getElementById('log-title').textContent =
    services.length === 1 ? SERVICE_LABEL[services[0]] : 'TU PEDIDO';
  // Subtítulo: una herramienta -> su nombre; varias -> resumen
  document.getElementById('log-tool').textContent =
    cart.length === 1 ? cart[0].tool
    : cart.length > 1 ? `${cart.length} herramientas · ${totalUnits} u.`
    : (current.tool?.name || '');
  // Foto: solo cuando el pedido es de una única herramienta
  const logPhoto = document.getElementById('log-photo');
  const only = cart.length === 1 ? TOOLS.find(t => t.id === cart[0].toolId) : null;
  if(only && only.img){ logPhoto.src = only.img; logPhoto.hidden = false; } else { logPhoto.hidden = true; }
  setupAddressField('log-address','log-map', { locateInput:true });
  const savedLink = document.getElementById('log-saved-link');
  savedLink.style.display = localStorage.getItem('wt_saved_address') ? 'inline-block' : 'none';
}

function useSavedAddress(){
  const saved = localStorage.getItem('wt_saved_address');
  if(!saved) return;
  const input = document.getElementById('log-address');
  input.value = saved;
  orderData.address = saved;
  geocodeInto(saved, 'log-map', input);
}

function finishOrder(){
  const address = document.getElementById('log-address').value.trim();
  if(!address){ alert('Ingresá tu dirección de retiro.'); return; }
  orderData.address = address;
  localStorage.setItem('wt_saved_address', address);

  const dateVal = document.getElementById('log-date').value;
  const btn = document.getElementById('btn-finish');
  btn.textContent = 'Enviando...'; btn.disabled = true;

  const payload = {
    cliente:{ numero: orderData.clientNumber },
    pedidos: cart,
    logistica:{ direccion: orderData.address, cp: document.getElementById('log-cp').value.trim(),
                fecha_retiro: dateVal, coordenadas: orderData.coordinates }
  };
  console.log('--> ENVIANDO AL SISTEMA COMERCIAL <--\n' + JSON.stringify(payload, null, 2));

  const vendor = VENDORS[Math.floor(Math.random()*VENDORS.length)];
  const fecha  = dateVal ? formatDate(dateVal) : 'a coordinar';

  setTimeout(() => {
    btn.textContent = 'Finalizar'; btn.disabled = false;
    document.getElementById('success-msg').innerHTML =
      `¡PERFECTO!<br>EL VENDEDOR ${vendor.toUpperCase()} VA A ESTAR PASANDO POR TU UBICACIÓN EL DÍA ${fecha.toUpperCase()}`;
    // El pedido ya se envió: vaciamos carrito y datos para que un próximo pedido arranque limpio.
    cart = []; refreshCartBadge();
    clearLogisticsFields();
    orderData.address = ''; orderData.coordinates = null;
    current = { service: current.service, tool:null, draft:{} };
    goTo('screen-success');
  }, 1200);
}

function scheduleVisit(){
  const d = document.getElementById('cal-date').value;
  if(!d){ alert('Elegí una fecha.'); return; }
  alert(`Visita agendada para el ${formatDate(d)}.`);
  goTo('screen-service');
}

function formatDate(iso){
  const [y,m,dd] = iso.split('-');
  return `${dd}/${m}/${y}`;
}

/* ==========================  RESET / CHAT  ============================ */
function resetApp(){
  cart = [];
  current = { service:'afilado', tool:null, draft:{} };
  refreshCartBadge();
  clearLogisticsFields();                 // no arrastrar dirección/CP/fecha del pedido anterior
  orderData.address = ''; orderData.coordinates = null;
  historyStack = ['screen-landing','screen-service'];
  goTo('screen-service', true);
}

function clearLogisticsFields(){
  ['log-address','log-cp','log-date'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  const map = document.getElementById('log-map');
  if(map) map.classList.remove('open');   // cierra el mini-mapa de la zona
}

function openWhatsApp(motivo){
  const msg = `Hola, soy el cliente ${orderData.clientNumber || 'nuevo'}. Quería consultar sobre: *${motivo}*`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ==========================  TOAST  ================================== */
let toastTimer;
function flash(text){
  let t = document.getElementById('wt-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'wt-toast';
    t.style.cssText = 'position:absolute;left:50%;bottom:74px;transform:translateX(-50%) translateY(20px);'
      + 'background:#111318;color:#fff;padding:11px 20px;border-radius:30px;font-weight:700;font-size:.95rem;'
      + 'z-index:300;opacity:0;transition:opacity .25s,transform .25s;box-shadow:0 8px 22px rgba(0,0,0,.3);pointer-events:none;';
    document.getElementById('app').appendChild(t);
  }
  t.textContent = text;
  requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 1600);
}

/* ==========================  GOOGLE MAPS  ============================
   Compatible con la API moderna (importLibrary) y con la clásica.
   Si Google Maps no carga, los campos de dirección funcionan como texto. */
let mapsReady = false, mapsLoading = false, MapCls, MarkerCls, GeocoderCls, AutocompleteCls, geocoder, useAdvanced = false;
const mapRegistry = {};       // mapWrapId -> { map, marker }
const pendingFields = [];     // colas de campos hasta que Maps esté listo
// Para producción, reemplazar por un Map ID propio (Google Cloud Console).
const MAP_ID = 'DEMO_MAP_ID';

function initMapsApi(){
  if(mapsReady || mapsLoading) return;      // evita doble inicialización (callback + DOMContentLoaded)
  if(typeof google === 'undefined' || !google.maps) return;
  try{
    // 1) API clásica (disponible con libraries=places,marker en la URL)
    if(google.maps.Map && google.maps.Geocoder && google.maps.places && google.maps.places.Autocomplete){
      MapCls = google.maps.Map;
      GeocoderCls = google.maps.Geocoder;
      AutocompleteCls = google.maps.places.Autocomplete;
      if(google.maps.marker && google.maps.marker.AdvancedMarkerElement){
        MarkerCls = google.maps.marker.AdvancedMarkerElement; useAdvanced = true;
      }
      geocoder = new GeocoderCls();
      mapsReady = true; flushMapQueue(); return;
    }
    // 2) API moderna (importLibrary)
    if(typeof google.maps.importLibrary === 'function'){
      mapsLoading = true;
      Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('geocoding'),
        google.maps.importLibrary('places'),
      ]).then(([maps, marker, geo, places]) => {
        MapCls = maps.Map; MarkerCls = marker.AdvancedMarkerElement; useAdvanced = true;
        GeocoderCls = geo.Geocoder; AutocompleteCls = places.Autocomplete;
        geocoder = new GeocoderCls();
        mapsReady = true; mapsLoading = false; flushMapQueue();
      }).catch(e => { mapsLoading = false; console.warn('Google Maps: no se pudieron cargar las librerías.', e); });
    }
  }catch(e){ console.warn('Google Maps no disponible:', e); }
}
// callback del script de Google Maps
window.onMapsLoaded = initMapsApi;

function flushMapQueue(){
  const q = pendingFields.splice(0);
  q.forEach(a => { try{ setupAddressField(a[0], a[1], a[2]); }catch(e){ console.warn('Maps: campo omitido', a[0], e); } });
}

/* Helpers para abstraer marcador avanzado vs clásico */
function makeMarker(map, pos){
  return useAdvanced ? new MarkerCls({ map, position:pos, gmpDraggable:true })
                     : new google.maps.Marker({ map, position:pos, draggable:true });
}
function setMarkerPos(m, loc){ if(useAdvanced) m.position = loc; else m.setPosition(loc); }
function getMarkerPos(m){
  const p = useAdvanced ? m.position : m.getPosition();
  return { lat: typeof p.lat==='function'?p.lat():p.lat, lng: typeof p.lng==='function'?p.lng():p.lng };
}

function setupAddressField(inputId, mapWrapId, opts = {}){
  const input = document.getElementById(inputId);
  if(!input || input.dataset.acReady) return;
  if(!mapsReady){                    // aún no cargó Maps: encolar
    if(!pendingFields.some(a => a[0] === inputId)) pendingFields.push([inputId, mapWrapId, opts]);
    return;
  }
  let ac;
  try{
    ac = new AutocompleteCls(input, {
      componentRestrictions:{ country:'ar' },
      fields:['formatted_address','geometry','name'],
    });
  }catch(e){
    // Si el widget de Places no está disponible, el campo sigue como texto simple.
    console.warn('Places Autocomplete no disponible; el campo funciona como texto.', e);
    return;
  }
  input.dataset.acReady = '1';          // sólo tras crear el widget con éxito
  ac.addListener('place_changed', () => {
    const place = ac.getPlace();
    if(place.geometry){
      showZone(mapWrapId, place.geometry.location, input);
      if(place.formatted_address) input.value = place.formatted_address;
      orderData.address = input.value;
    }
  });
  // El Enter lo maneja el propio widget de Autocomplete (elige la 1ª sugerencia);
  // no agregamos un geocode manual para no competir con esa selección.
  // Al editar el texto a mano, las coordenadas dejan de coincidir: invalidarlas.
  input.addEventListener('input', () => {
    if(input.dataset.geo === '1'){ input.dataset.geo = ''; orderData.coordinates = null; }
  });
}

function ensureMapInstance(mapWrapId, center){
  let reg = mapRegistry[mapWrapId];
  if(reg) return reg;
  const el = document.getElementById(mapWrapId).querySelector('.mini-map');
  const opts = { zoom:15, center, disableDefaultUI:true, gestureHandling:'greedy' };
  if(useAdvanced) opts.mapId = MAP_ID;
  const map = new MapCls(el, opts);
  const marker = makeMarker(map, center);
  marker.addListener('dragend', () => reverseGeocode(getMarkerPos(marker), mapWrapId));
  map.addListener('click', e => { setMarkerPos(marker, e.latLng); map.panTo(e.latLng); reverseGeocode(e.latLng, mapWrapId); });
  reg = { map, marker };
  mapRegistry[mapWrapId] = reg;
  return reg;
}

function showZone(mapWrapId, location, input){
  const reg = ensureMapInstance(mapWrapId, location);
  reg.map.setCenter(location); reg.map.setZoom(16); setMarkerPos(reg.marker, location);
  const wrap = document.getElementById(mapWrapId);
  wrap.classList.add('open');
  // Redimensionar el mapa recién cuando termina la animación de apertura del contenedor.
  const doResize = () => { if(window.google && google.maps && google.maps.event) google.maps.event.trigger(reg.map, 'resize'); reg.map.setCenter(location); };
  wrap.addEventListener('transitionend', doResize, { once:true });
  setTimeout(doResize, 450);            // respaldo si transitionend no dispara
  orderData.coordinates = typeof location.lat === 'function' ? { lat:location.lat(), lng:location.lng() } : location;
  if(input) input.dataset.geo = '1';    // dirección respaldada por coordenadas válidas
}

function geocodeInto(text, mapWrapId, input){
  if(!geocoder || !text) return;
  const q = /argentina/i.test(text) ? text : `${text}, Argentina`;
  geocoder.geocode({ address:q }, (res, status) => {
    if(status === 'OK' && res[0]){
      const loc = res[0].geometry.location;
      showZone(mapWrapId, loc, input);
      input.value = res[0].formatted_address;
      orderData.address = input.value;
    } else {
      alert('No encontramos esa dirección. Probá con más detalle.');
    }
  });
}

function reverseGeocode(pos, mapWrapId){
  if(!geocoder) return;
  const loc = { lat: typeof pos.lat==='function'?pos.lat():pos.lat, lng: typeof pos.lng==='function'?pos.lng():pos.lng };
  orderData.coordinates = loc;
  geocoder.geocode({ location:loc }, (res, status) => {
    if(status === 'OK' && res[0]){
      const input = mapWrapId === 'log-map' ? document.getElementById('log-address')
                  : mapWrapId === 'reg-map' ? document.getElementById('reg-address')
                  : document.getElementById('reg-ship');
      if(input){ input.value = res[0].formatted_address; orderData.address = input.value; input.dataset.geo = '1'; }
    }
  });
}

/* ==========================  INIT  ================================== */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cart-btn').addEventListener('click', renderCart);
  document.getElementById('detail-fields').addEventListener('input', () => { current.dirty = true; });
  setupAddressField('reg-address','reg-map');   // se encola si Maps aún no cargó
  refreshCartBadge();
  initMapsApi();                                 // por si Maps ya estaba disponible
});
