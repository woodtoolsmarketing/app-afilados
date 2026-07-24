/* ==========================================================================
   Afilador digital WoodTools — lógica de la app
   ========================================================================== */

const WHATSAPP_NUMBER = "5491134609057";
// Vendedores de cada zona (según la planilla). El 1º es quien pasa a retirar.
const VENDORS_BY_ZONE = {
  'Oeste':    ['Alan Calvi', 'Sebastián Sayago'],
  'Norte':    ['Roberto Golik', 'Sebastián Sayago', 'Blasco Jorge'],
  'La Plata': ['Saad'],
  'CABA':     ['Lucas', 'Saad'],
  'Sur':      ['Lucas'],
};

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

/* ============ ZONAS Y DÍAS DE VISITA DE VENDEDORES =====================
   days: 1=Lunes ... 5=Viernes (coinciden con Date.getDay()).
   Datos según la planilla "Días y zonas de visita de vendedores".        */
const DIA_NOMBRE = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIA_ABREV  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const LOCALITIES = [
  // ---- CABA ----
  { name:'Capital', zone:'CABA', days:[2,4,5], aliases:['ciudad autonoma de buenos aires','ciudad de buenos aires','caba','capital federal'] },
  { name:'Palermo', zone:'CABA', days:[2,4,5] },
  { name:'Paternal', zone:'CABA', days:[2,4,5] },
  { name:'Floresta', zone:'CABA', days:[2,4,5] },
  { name:'Villa Crespo', zone:'CABA', days:[2,4,5] },
  { name:'Congreso', zone:'CABA', days:[2,4,5] },
  { name:'Nueva Pompeya', zone:'CABA', days:[2,4], aliases:['pompeya'] },
  { name:'Barracas', zone:'CABA', days:[2,4] },
  { name:'Caballito', zone:'CABA', days:[2,4] },
  { name:'Bajo Flores', zone:'CABA', days:[4] },
  { name:'Flores', zone:'CABA', days:[2] },
  // ---- La Plata ----
  { name:'La Plata', zone:'La Plata', days:[1,3] },
  { name:'City Bell', zone:'La Plata', days:[1,3] },
  { name:'Villa Elisa', zone:'La Plata', days:[3] },
  { name:'Berisso', zone:'La Plata', days:[1], aliases:['beriso'] },
  { name:'Los Hornos', zone:'La Plata', days:[1] },
  { name:'Abasto', zone:'La Plata', days:[1] },
  // ---- Sur ----
  { name:'Lanús', zone:'Sur', days:[1] },
  { name:'Remedios de Escalada', zone:'Sur', days:[1], aliases:['escalada'] },
  { name:'Temperley', zone:'Sur', days:[1] },
  { name:'Lomas de Zamora', zone:'Sur', days:[1] },
  { name:'Llavallol', zone:'Sur', days:[1], aliases:['guillon'] },
  { name:'9 de Abril', zone:'Sur', days:[1] },
  { name:'Bernal', zone:'Sur', days:[3] },
  { name:'Quilmes', zone:'Sur', days:[3] },
  { name:'Ezpeleta', zone:'Sur', days:[3] },
  { name:'Florencio Varela', zone:'Sur', days:[3], aliases:['varela'] },
  { name:'Berazategui', zone:'Sur', days:[3] },
  { name:'Monte Grande', zone:'Sur', days:[5] },
  { name:'Ezeiza', zone:'Sur', days:[5] },
  { name:'Cañuelas', zone:'Sur', days:[5] },
  { name:'Adrogué', zone:'Sur', days:[5] },
  { name:'Canning', zone:'Sur', days:[5] },
  // ---- Oeste ----
  { name:'Morón', zone:'Oeste', days:[1,3] },
  { name:'Villa Celina', zone:'Oeste', days:[1] },
  { name:'Gregorio de Laferrere', zone:'Oeste', days:[1,3,4], aliases:['laferrere','la ferrere'] },
  { name:'Isidro Casanova', zone:'Oeste', days:[1,3,4] },
  { name:'Ciudad Evita', zone:'Oeste', days:[1] },
  { name:'Ciudadela', zone:'Oeste', days:[2] },
  { name:'Caseros', zone:'Oeste', days:[2,5] },
  { name:'El Palomar', zone:'Oeste', days:[2,5], aliases:['palomar'] },
  { name:'José C. Paz', zone:'Oeste', days:[2,5], aliases:['jose c paz'] },
  { name:'Los Polvorines', zone:'Oeste', days:[2,5], aliases:['polvorines'] },
  { name:'Bella Vista', zone:'Oeste', days:[2,5] },
  { name:'Ramos Mejía', zone:'Oeste', days:[3], aliases:['r mejia'] },
  { name:'Haedo', zone:'Oeste', days:[3,5] },
  { name:'Villa Bosch', zone:'Oeste', days:[3], aliases:['v bosch'] },
  { name:'Luján', zone:'Oeste', days:[3] },
  { name:'Jáuregui', zone:'Oeste', days:[3] },
  { name:'General Rodríguez', zone:'Oeste', days:[3], aliases:['g rodriguez'] },
  { name:'San Justo', zone:'Oeste', days:[3,4] },
  { name:'La Tablada', zone:'Oeste', days:[3,4] },
  { name:'Lomas del Mirador', zone:'Oeste', days:[3,4] },
  { name:'Villa Madero', zone:'Oeste', days:[4] },
  { name:'Castelar', zone:'Oeste', days:[5] },
  { name:'Ituzaingó', zone:'Oeste', days:[1,5] },
  { name:'Mercedes', zone:'Oeste', days:[5] },
  { name:'Pilar', zone:'Oeste', days:[5] },
  { name:'Merlo', zone:'Oeste', days:[1] },
  { name:'Hurlingham', zone:'Oeste', days:[1] },
  // ---- Norte ----
  { name:'San Miguel', zone:'Norte', days:[4] },
  { name:'General Pacheco', zone:'Norte', days:[4], aliases:['pacheco'] },
  { name:'Tigre', zone:'Norte', days:[3,4] },
  { name:'San Martín', zone:'Norte', days:[2] },
  { name:'Villa Ballester', zone:'Norte', days:[2], aliases:['v ballester'] },
  { name:'Martínez', zone:'Norte', days:[2], aliases:['martelli'] },
  { name:'Florida', zone:'Norte', days:[2] },
  { name:'Munro', zone:'Norte', days:[2] },
  { name:'Boulogne', zone:'Norte', days:[1,5], aliases:['boulogne sur mer'] },
  { name:'Grand Bourg', zone:'Norte', days:[1,5] },
  { name:'Villa Adelina', zone:'Norte', days:[1,5] },
  { name:'San Fernando', zone:'Norte', days:[3,5] },
  { name:'Victoria', zone:'Norte', days:[3] },
  { name:'Rincón de Milberg', zone:'Norte', days:[3] },
  { name:'El Talar', zone:'Norte', days:[3], aliases:['talar de pacheco'] },
  { name:'Benavídez', zone:'Norte', days:[3,5] },
  { name:'Tortuguitas', zone:'Norte', days:[3] },
  { name:'Olivos', zone:'Norte', days:[4] },
  { name:'Vicente López', zone:'Norte', days:[4], aliases:['v lopez'] },
  { name:'Acassuso', zone:'Norte', days:[4] },
  { name:'Beccar', zone:'Norte', days:[4] },
  { name:'Virreyes', zone:'Norte', days:[4] },
  { name:'San Isidro', zone:'Norte', days:[4] },
  { name:'Don Torcuato', zone:'Norte', days:[5] },
];

function normLoc(s){
  return (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}
const LOC_MAP = (() => {
  const m = {};
  LOCALITIES.forEach(e => { m[normLoc(e.name)] = e; (e.aliases||[]).forEach(a => m[normLoc(a)] = e); });
  return m;
})();
const LOC_KEYS = LOCALITIES
  .flatMap(e => [e.name, ...(e.aliases||[])].map(n => ({ key: normLoc(n), e })))
  .sort((a, b) => b.key.length - a.key.length);

function resolveZone(components, formatted){
  if(Array.isArray(components)){
    const order = ['sublocality_level_1','sublocality','neighborhood','locality','administrative_area_level_2','administrative_area_level_1'];
    for(const type of order){
      for(const c of components){
        if(c.types && c.types.includes(type)){
          const hit = LOC_MAP[normLoc(c.long_name)];
          if(hit) return hit;
        }
      }
    }
  }
  const nf = ' ' + normLoc(formatted) + ' ';
  for(const { key, e } of LOC_KEYS){ if(nf.includes(' ' + key + ' ')) return e; }
  return null;
}
function diasTexto(days){
  const names = days.slice().sort((a, b) => a - b).map(d => DIA_NOMBRE[d]);
  return names.length <= 1 ? (names[0] || '') : names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
}

/* ----- Fechas de retiro disponibles según los días de la zona ---------- */
function isoDate(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function nextPickupDates(allowedDays, count){
  const dates = [], d = new Date();
  d.setHours(12,0,0,0); d.setDate(d.getDate() + 1);   // desde mañana
  let guard = 0;
  while(dates.length < count && guard < 120){
    if(allowedDays.includes(d.getDay())) dates.push(new Date(d));
    d.setDate(d.getDate() + 1); guard++;
  }
  return dates;
}
function renderPickupChips(allowedDays){
  const cont = document.getElementById('pickup-dates');
  cont.innerHTML = '';
  nextPickupDates(allowedDays, 8).forEach(d => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pickup-chip'; b.dataset.iso = isoDate(d);
    b.innerHTML = `<span class="pc-day">${DIA_ABREV[d.getDay()]}</span>`
      + `<span class="pc-date">${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}</span>`;
    b.addEventListener('click', () => {
      cont.querySelectorAll('.pickup-chip').forEach(c => c.classList.remove('sel'));
      b.classList.add('sel');
      orderData.pickupDate = b.dataset.iso;
    });
    cont.appendChild(b);
  });
}
function initPickup(){
  const note = document.getElementById('pickup-note');
  note.textContent = 'Elegí el día de retiro. Al ingresar tu dirección te mostramos los días exactos de tu zona.';
  note.classList.add('muted');
  orderData.pickupDate = null;
  renderPickupChips([1,2,3,4,5]);
}
function updatePickupForAddress(components, formatted){
  const match = resolveZone(components, formatted);
  const note = document.getElementById('pickup-note');
  orderData.pickupDate = null;
  orderData.zone = match ? match.zone : null;
  const zoneVendors = match ? (VENDORS_BY_ZONE[match.zone] || []) : [];
  orderData.zoneVendors = zoneVendors;
  orderData.vendor = zoneVendors[0] || null;   // el primero es quien pasa a retirar
  if(match){
    const vendor = orderData.vendor ? ` Te visita <strong>${orderData.vendor}</strong>.` : '';
    note.classList.remove('muted');
    note.innerHTML = `Pasamos por <strong>${match.name}</strong> (Zona ${match.zone}) los <strong>${diasTexto(match.days)}</strong>.${vendor} Elegí tu día:`;
    renderPickupChips(match.days);
  } else {
    note.classList.add('muted');
    note.textContent = 'No detectamos tu zona. Elegí un día y lo coordinamos con un vendedor:';
    renderPickupChips([1,2,3,4,5]);
  }
}

/* Autocompleta el código postal a partir de la dirección del mapa */
function fillPostalCode(mapWrapId, components){
  if(!Array.isArray(components)) return;
  const pc = components.find(c => c.types && c.types.includes('postal_code'));
  if(!pc) return;
  const id = mapWrapId === 'log-map' ? 'log-cp' : mapWrapId === 'reg-map' ? 'reg-cp' : null;
  const el = id && document.getElementById(id);
  if(el) el.value = pc.long_name;
}

/* ----- Calendario de visitas (pantalla) ------------------------------- */
function renderCalendar(filter){
  const list = document.getElementById('cal-list');
  if(!list) return;
  const nf = normLoc(filter || '');
  const items = LOCALITIES
    .filter(e => !nf || normLoc(e.name).includes(nf) || normLoc(e.zone).includes(nf)
      || (e.aliases||[]).some(a => normLoc(a).includes(nf)))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if(!items.length){
    list.innerHTML = '<p class="cart-empty">No encontramos esa localidad. Escribinos y lo coordinamos.</p>';
    return;
  }
  list.innerHTML = items.map(e => `
    <div class="cal-item">
      <div class="cal-main"><span class="cal-name">${e.name}</span><span class="cal-zone">Zona ${e.zone}</span></div>
      <div class="cal-days">${[1,2,3,4,5].map(d =>
        `<span class="cal-day${e.days.includes(d) ? ' on' : ''}">${DIA_ABREV[d]}</span>`).join('')}</div>
    </div>`).join('');
}

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

  // ----- Sierras: pregunta 1 modelo / varios + grupos repetibles ---------
  if(t.type === 'sierra'){
    current.sierraMode = 'uno';
    current.sierraGroups = [{ qty:'1', teeth:'', model:'' }];
    const section = document.createElement('div');
    section.id = 'sierra-section';
    box.appendChild(section);
    renderSierraSection();
    return;
  }

  // ----- Mechas / simples: cantidad + modelo ------------------------------
  box.appendChild(fieldHTML(`Cantidad de ${t.name.toLowerCase()}`,
    `<input type="number" min="1" value="1" id="d-qty" class="box-input half" inputmode="numeric">`, 'd-qty'));

  if(t.type === 'mechas'){
    box.appendChild(buildCustomSelect(`Modelo de ${t.name.toLowerCase()}`, MECHA_MODELS));
  } else {
    box.appendChild(fieldHTML(`Modelo de ${t.name.toLowerCase()}`,
      `<input type="text" id="d-model" class="box-input" placeholder="Ej: marca / medida">`, 'd-model'));
  }
}

/* ----- Sección de sierras (1 modelo o varios) -------------------------- */
function renderSierraSection(){
  const section = document.getElementById('sierra-section');
  const s = current.service;
  const teethLabel = s === 'reparacion' ? 'Cantidad de dientes a reparar' : 'Cantidad de dientes';
  section.innerHTML = '';

  // Pregunta: ¿un solo modelo o varios?
  const q = document.createElement('div');
  q.className = 'field';
  q.innerHTML = `<label>¿Es un solo modelo o varios?</label>
    <div class="seg" role="group" aria-label="Cantidad de modelos">
      <button type="button" class="seg-btn ${current.sierraMode==='uno'?'active':''}"    data-mode="uno"    aria-pressed="${current.sierraMode==='uno'}">Un modelo</button>
      <button type="button" class="seg-btn ${current.sierraMode==='varios'?'active':''}" data-mode="varios" aria-pressed="${current.sierraMode==='varios'}">Varios modelos</button>
    </div>`;
  q.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => setSierraMode(b.dataset.mode)));
  section.appendChild(q);

  // Grupos (recuadros) de sierras
  current.sierraGroups.forEach((g, i) => section.appendChild(buildSierraGroup(g, i, teethLabel)));

  // Botón "+ sierra nueva" (sólo en modo varios)
  if(current.sierraMode === 'varios'){
    const add = document.createElement('button');
    add.type = 'button'; add.className = 'btn-add'; add.id = 'add-sierra';
    add.innerHTML = '<span>+</span> sierra nueva';
    add.addEventListener('click', addSierraGroup);
    section.appendChild(add);
  }

  updateGrandTotal();
}

function buildSierraGroup(g, i, teethLabel){
  const varios = current.sierraMode === 'varios';
  const wrap = document.createElement('div');
  wrap.className = 'sierra-group' + (varios ? ' boxed' : '');
  wrap.dataset.idx = i;

  const head = varios
    ? `<div class="sg-head"><span class="sg-title">Sierra ${i+1}</span>${current.sierraGroups.length>1 ? '<button type="button" class="sg-remove" aria-label="Quitar sierra">✕</button>' : ''}</div>`
    : '';
  wrap.innerHTML = head +
    `<div class="field"><label>Cantidad de sierras</label>
       <input type="number" min="1" class="box-input half g-qty" inputmode="numeric"></div>
     <div class="field"><label>${teethLabel}</label>
       <input type="number" min="0" class="box-input half g-teeth" inputmode="numeric">
       <span class="teeth-total" aria-live="polite"></span></div>
     <div class="field"><label>Modelo de la sierra</label>
       <input type="text" class="box-input g-model" placeholder="Ej: marca / medida"></div>`;

  const qtyIn = wrap.querySelector('.g-qty');
  const teethIn = wrap.querySelector('.g-teeth');
  const modelIn = wrap.querySelector('.g-model');
  const totalEl = wrap.querySelector('.teeth-total');
  qtyIn.value = g.qty ?? ''; teethIn.value = g.teeth ?? ''; modelIn.value = g.model ?? '';

  // Reparación: comprar una nueva
  if(current.service === 'reparacion'){
    const teethField = wrap.querySelectorAll('.field')[1];
    const link = document.createElement('a');
    link.href = '#'; link.className = 'field-link';
    link.textContent = '¿Queres comprar una nueva?';
    link.onclick = (e) => { e.preventDefault(); openWhatsApp(`Quiero comprar una ${current.tool.name} nueva`); };
    teethField.appendChild(link);
  }

  const computeTotal = () => {
    const q = parseInt(qtyIn.value || '0', 10), d = parseInt(teethIn.value || '0', 10);
    totalEl.textContent = (q > 0 && d > 0) ? `= ${q * d} dientes en total` : '';
  };
  const onInput = () => {
    g.qty = qtyIn.value; g.teeth = teethIn.value;
    computeTotal(); current.dirty = true; updateGrandTotal();
  };
  qtyIn.addEventListener('input', onInput);
  teethIn.addEventListener('input', onInput);
  modelIn.addEventListener('input', () => { g.model = modelIn.value; current.dirty = true; });

  const rm = wrap.querySelector('.sg-remove');
  if(rm) rm.addEventListener('click', () => removeSierraGroup(i));

  computeTotal();               // total inicial sin marcar "dirty"
  return wrap;
}

function setSierraMode(mode){
  if(mode === current.sierraMode) return;
  current.sierraMode = mode;
  if(mode === 'uno') current.sierraGroups = [current.sierraGroups[0] || { qty:'1', teeth:'', model:'' }];
  current.dirty = true;
  renderSierraSection();
}

function addSierraGroup(){
  current.sierraGroups.push({ qty:'1', teeth:'', model:'' });
  current.dirty = true;
  renderSierraSection();
  // enfoca la cantidad del recuadro recién agregado
  const groups = document.querySelectorAll('#sierra-section .sierra-group');
  groups[groups.length - 1]?.querySelector('.g-qty')?.focus();
}

function removeSierraGroup(i){
  if(current.sierraGroups.length <= 1) return;
  current.sierraGroups.splice(i, 1);
  current.dirty = true;
  renderSierraSection();
}

function updateGrandTotal(){
  const section = document.getElementById('sierra-section');
  if(!section) return;
  const total = current.sierraGroups.reduce((sum, g) => {
    const q = parseInt(g.qty || '0', 10), d = parseInt(g.teeth || '0', 10);
    return sum + (q > 0 && d > 0 ? q * d : 0);
  }, 0);
  let el = section.querySelector('.grand-total');
  if(total > 0 && current.sierraGroups.length > 1){
    if(!el){ el = document.createElement('p'); el.className = 'grand-total'; section.appendChild(el); }
    const verb = current.service === 'reparacion' ? 'reparar' : 'afilar';
    el.textContent = `Total de dientes a ${verb}: ${total}`;
  } else if(el){ el.remove(); }
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

/* ----- Leer el detalle y armar los ítems (devuelve array o null) ------- */
function readDetail(){
  const t = current.tool, s = current.service;

  // Sierras: un ítem por cada recuadro (modelo)
  if(t.type === 'sierra'){
    const items = [];
    for(let i = 0; i < current.sierraGroups.length; i++){
      const g = current.sierraGroups[i];
      const qty = parseInt(g.qty || '0', 10);
      if(!qty || qty < 1){
        alert(current.sierraMode === 'varios'
          ? `Ingresá la cantidad de sierras en el modelo ${i + 1}.`
          : 'Ingresá una cantidad válida.');
        return null;
      }
      const item = { service:s, toolId:t.id, tool:t.name, quantity:qty };
      const teeth = parseInt(g.teeth || '0', 10);
      if(teeth > 0){ item.teeth = teeth; item.totalTeeth = teeth * qty; }
      const model = (g.model || '').trim();
      if(model) item.model = model;
      items.push(item);
    }
    return items;
  }

  // Mechas / simples: un único ítem
  const qty = parseInt(document.getElementById('d-qty')?.value || '0', 10);
  if(!qty || qty < 1){ alert('Ingresá una cantidad válida.'); return null; }
  const item = { service:s, toolId:t.id, tool:t.name, quantity:qty };
  if(t.type === 'mechas'){
    if(!current.draft.model){ alert('Elegí un modelo.'); return null; }
    item.model = current.draft.model;
  } else {
    const m = document.getElementById('d-model')?.value.trim();
    if(m) item.model = m;
  }
  return [item];
}

function addToCart(){
  const items = readDetail();
  if(!items) return;
  cart.push(...items);
  refreshCartBadge(true);
  flash(items.length > 1 ? `${items.length} sierras agregadas ✓` : 'Agregado al carrito ✓');
  renderDetail();               // limpia el formulario
}

function nextFromDetail(){
  // Solo agrega el ítem actual si el formulario fue editado (evita duplicar
  // cuando el usuario ya tocó "Agregar al carrito" antes de "Siguiente").
  if(current.dirty){
    const items = readDetail();
    if(!items) return;
    cart.push(...items);
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
    const teethTxt = it.teeth ? `${it.totalTeeth} dientes (${it.teeth}×${it.quantity})` : null;
    const sub = [SERVICE_LABEL[it.service], it.model, teethTxt]
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
  initPickup();   // días de retiro por defecto hasta que se resuelva la dirección
  // Si ya había una dirección resuelta (volvimos a esta pantalla), restaura los días de la zona.
  if(mapsReady && orderData.coordinates) reverseGeocode(orderData.coordinates, 'log-map');
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

  const dateVal = orderData.pickupDate;
  if(!dateVal){ alert('Elegí un día de retiro.'); return; }
  const btn = document.getElementById('btn-finish');
  btn.textContent = 'Enviando...'; btn.disabled = true;

  const payload = {
    cliente:{ numero: orderData.clientNumber },
    pedidos: cart,
    logistica:{ direccion: orderData.address, cp: document.getElementById('log-cp').value.trim(),
                zona: orderData.zone || null, vendor: orderData.vendor || null,
                vendedores_zona: orderData.zoneVendors || [],
                fecha_retiro: dateVal, coordenadas: orderData.coordinates }
  };
  console.log('--> ENVIANDO AL SISTEMA COMERCIAL <--\n' + JSON.stringify(payload, null, 2));

  const fecha = formatDate(dateVal);
  const vendorLine = orderData.vendor
    ? `EL VENDEDOR ${orderData.vendor.toUpperCase()}`
    : 'UN VENDEDOR';

  setTimeout(() => {
    btn.textContent = 'Finalizar'; btn.disabled = false;
    document.getElementById('success-msg').innerHTML =
      `¡PERFECTO!<br>${vendorLine} VA A ESTAR PASANDO POR TU UBICACIÓN EL DÍA ${fecha.toUpperCase()}`;
    // El pedido ya se envió: vaciamos carrito y datos para que un próximo pedido arranque limpio.
    cart = []; refreshCartBadge();
    clearLogisticsFields();
    orderData.address = ''; orderData.coordinates = null;
    orderData.vendor = null; orderData.zone = null; orderData.zoneVendors = [];
    current = { service: current.service, tool:null, draft:{} };
    goTo('screen-success');
  }, 1200);
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
  const chips = document.getElementById('pickup-dates'); if(chips) chips.innerHTML = '';
  orderData.pickupDate = null; orderData.vendor = null; orderData.zone = null; orderData.zoneVendors = [];
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
      fields:['formatted_address','geometry','name','address_components'],
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
      fillPostalCode(mapWrapId, place.address_components);
      if(mapWrapId === 'log-map') updatePickupForAddress(place.address_components, input.value);
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
      fillPostalCode(mapWrapId, res[0].address_components);
      if(mapWrapId === 'log-map') updatePickupForAddress(res[0].address_components, input.value);
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
      fillPostalCode(mapWrapId, res[0].address_components);
      if(mapWrapId === 'log-map') updatePickupForAddress(res[0].address_components, res[0].formatted_address);
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

  // Calendario de visitas: búsqueda por localidad
  const calSearch = document.getElementById('cal-search');
  if(calSearch){ calSearch.addEventListener('input', e => renderCalendar(e.target.value)); renderCalendar(''); }

  // FAQ del servicio (acordeón animado)
  document.querySelectorAll('#service-faq .faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement, ans = q.nextElementSibling;
      const open = item.classList.toggle('open');
      q.classList.toggle('active', open);
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : null;
    });
  });
});
