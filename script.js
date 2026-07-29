/* ==========================================================================
   Afilador digital WoodTools — lógica de la app
   ========================================================================== */

const WHATSAPP_NUMBER = "5491134609057";
// Vendedores de cada zona (según la planilla). El 1º es quien pasa a retirar / recibe la consulta.
const VENDORS_BY_ZONE = {
  'Oeste':    ['Sebastián Sayago', 'Alan Calvi'],
  'Norte':    ['Sebastián Sayago', 'Roberto Golik', 'Jorge Blasco'],
  'La Plata': ['Nicolas Saad'],
  'CABA':     ['Lucas Cabaña', 'Nicolas Saad'],
  'Sur':      ['Lucas Cabaña'],
};
// WhatsApp de cada vendedor. Si la dirección no cae en ninguna zona -> Emmanuel.
const VENDOR_PHONES = {
  'Jorge Blasco':     '5491145640940',
  'Sebastián Sayago': '5491134609120',
  'Lucas Cabaña':     '5491145640831',
  'Alan Calvi':       '5491156321012',
  'Roberto Golik':    '5491164591316',
  'Luis Quevedo':     '5491168457778',
  'Nicolas Saad':     '5491157528427',
};
const FALLBACK_VENDOR = 'Emmanuel Capalbo';
const FALLBACK_PHONE  = '5491157528428';

// Partido (municipio) -> zona. Cubre las localidades aledañas de cada municipio
// aunque no estén listadas una por una (clave = administrative_area_level_2 de Google).
const PARTIDO_ZONE = {
  // Norte
  'san isidro':'Norte', 'vicente lopez':'Norte', 'san fernando':'Norte', 'tigre':'Norte',
  'general san martin':'Norte', 'san martin':'Norte', 'san miguel':'Norte',
  'malvinas argentinas':'Norte', 'escobar':'Norte',
  // Oeste
  'moron':'Oeste', 'hurlingham':'Oeste', 'ituzaingo':'Oeste', 'tres de febrero':'Oeste',
  'la matanza':'Oeste', 'merlo':'Oeste', 'moreno':'Oeste', 'general rodriguez':'Oeste',
  'lujan':'Oeste', 'marcos paz':'Oeste', 'mercedes':'Oeste', 'jose c paz':'Oeste', 'pilar':'Oeste',
  // Sur
  'lanus':'Sur', 'lomas de zamora':'Sur', 'avellaneda':'Sur', 'quilmes':'Sur',
  'berazategui':'Sur', 'florencio varela':'Sur', 'almirante brown':'Sur',
  'esteban echeverria':'Sur', 'ezeiza':'Sur', 'canuelas':'Sur', 'presidente peron':'Sur', 'san vicente':'Sur',
  // La Plata
  'la plata':'La Plata', 'berisso':'La Plata', 'ensenada':'La Plata',
};

const IMG = 'imagenes/Herramientas/';
/* Catálogo de herramientas.
   type: 'sierra' -> "¿Qué haces con la sierra?" (uso) + cantidad + dientes
                     + rascadores (sólo "Abro madera") + modelo (uno/varios)
         'mechas' -> cantidad + modelo (galería de fotos)
         'simple' -> cantidad + modelo (texto)
   broken: agrega "¿Tiene dientes rotos?" AL FINAL (fresas, sierras y mechas
           de bisagra); si dice que sí, pide "Cantidad de dientes rotos".      */
const TOOLS = [
  { id:'sierras',   name:'Sierras',   article:'la sierra',      type:'sierra', img:IMG+'SC%20melamina.png', broken:true },
  { id:'fresas',    name:'Fresas',    article:'la fresa',       type:'simple', img:IMG+'Fresa.png',        broken:true },
  { id:'mechas',    name:'Mechas',    article:'la mecha',       type:'mechas', img:IMG+'Mechas.png' },
  { id:'cuchillas', name:'Cuchillas', article:'la cuchilla',    type:'simple', img:IMG+'Cuchillas.png' },
  { id:'diamante',  name:'Diamante',  article:'la herramienta', type:'simple', img:IMG+'Diamante.png' },
  { id:'cabezales', name:'Cabezales', article:'el cabezal',     type:'simple', img:IMG+'Cabezales.png' },
];

// Modelos de mecha con su foto; el de bisagra habilita "¿Tiene dientes rotos?".
const MECHA_MODELS = [
  { name:'Mecha pasante',        img:IMG+'Mechas/1.png' },
  { name:'Mecha ciega',          img:IMG+'Mechas/2.png' },
  { name:'Mecha de bisagra',     img:IMG+'Mechas/3.png', broken:true },
  { name:'Fresa espiral widia',  img:IMG+'Mechas/4.png' },
  { name:'Fresa espiral negra',  img:IMG+'Mechas/5.png' },
  { name:'Fresa espiral color',  img:IMG+'Mechas/6.png' },
];

const SERVICE_LABEL = { afilado:'AFILADO', reparacion:'REPARACIÓN' };

// "¿Qué haces con la sierra?" -> define qué campos pide el detalle de sierras.
const USO_OPTIONS = [
  'Corto melamina, MDF, aglomerado, PVC y Aluminio',
  'Corto madera',
  'Abro madera',
];
const USO_KEY = { [USO_OPTIONS[0]]:'melamina', [USO_OPTIONS[1]]:'madera', [USO_OPTIONS[2]]:'abro' };
const USO_SHORT = { melamina:'Melamina/MDF/PVC/Alu', madera:'Corta madera', abro:'Abre madera' };

/* ============ ZONAS Y DÍAS DE VISITA DE VENDEDORES =====================
   days: 1=Lunes ... 5=Viernes (coinciden con Date.getDay()).
   Datos según la planilla "Días y zonas de visita de vendedores".        */
const DIA_NOMBRE = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIA_ABREV  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const LOCALITIES = [
  // ---- CABA ----
  { name:'Capital', zone:'CABA', days:[2,4], aliases:['ciudad autonoma de buenos aires','ciudad de buenos aires','caba','capital federal'] },
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
  { name:'San Andrés', zone:'Norte', days:[2] },
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

// Coordenadas de cada localidad visitada (para el radio de 5 km).
const COORDS = {
  'Capital':[-34.6037,-58.3816],'Palermo':[-34.5781,-58.4265],'Paternal':[-34.5959,-58.4716],
  'Floresta':[-34.6282,-58.4844],'Villa Crespo':[-34.5947,-58.4443],'Congreso':[-34.6097,-58.3903],
  'Nueva Pompeya':[-34.6501,-58.4254],'Barracas':[-34.6454,-58.3813],'Caballito':[-34.6159,-58.4406],
  'Bajo Flores':[-34.6473,-58.4492],'Flores':[-34.6375,-58.4601],'La Plata':[-34.9205,-57.9536],
  'City Bell':[-34.8783,-58.0430],'Villa Elisa':[-34.8535,-58.0791],'Berisso':[-34.8969,-57.9544],
  'Los Hornos':[-34.9601,-57.9722],'Abasto':[-34.9854,-58.0871],'Lanús':[-34.7067,-58.3917],
  'Remedios de Escalada':[-34.7212,-58.3985],'Temperley':[-34.7678,-58.3793],'Lomas de Zamora':[-34.7612,-58.4302],
  'Llavallol':[-34.7965,-58.4292],'9 de Abril':[-34.7561,-58.4866],'Bernal':[-34.7089,-58.2827],
  'Quilmes':[-34.7206,-58.2546],'Ezpeleta':[-34.7521,-58.2358],'Florencio Varela':[-34.7966,-58.2760],
  'Berazategui':[-34.7620,-58.2113],'Monte Grande':[-34.8272,-58.4620],'Ezeiza':[-34.8534,-58.5212],
  'Cañuelas':[-35.0326,-58.7339],'Adrogué':[-34.8012,-58.3889],'Canning':[-34.8713,-58.5111],
  'Morón':[-34.6559,-58.6167],'Villa Celina':[-34.6990,-58.4859],'Gregorio de Laferrere':[-34.7497,-58.5846],
  'Isidro Casanova':[-34.7085,-58.5859],'Ciudad Evita':[-34.7294,-58.5266],'Ciudadela':[-34.6347,-58.5397],
  'Caseros':[-34.6095,-58.5635],'El Palomar':[-34.6267,-58.5944],'José C. Paz':[-34.5151,-58.7662],
  'Los Polvorines':[-34.4996,-58.6914],'Bella Vista':[-34.5637,-58.6904],'Ramos Mejía':[-34.6549,-58.5536],
  'Haedo':[-34.6441,-58.5956],'Villa Bosch':[-34.5812,-58.5799],'Luján':[-34.5633,-59.1209],
  'Jáuregui':[-34.5992,-59.1711],'General Rodríguez':[-34.6022,-58.9490],'San Justo':[-34.6874,-58.5633],
  'La Tablada':[-34.6855,-58.5320],'Lomas del Mirador':[-34.6664,-58.5298],'Villa Madero':[-34.6866,-58.4942],
  'Castelar':[-34.6555,-58.6452],'Ituzaingó':[-34.6570,-58.6754],'Mercedes':[-34.6510,-59.4306],
  'Pilar':[-34.4663,-58.9154],'Merlo':[-34.6685,-58.7282],'Hurlingham':[-34.5896,-58.6276],
  'San Miguel':[-34.5431,-58.7119],'General Pacheco':[-34.4530,-58.6430],'Tigre':[-34.4251,-58.5797],
  'San Martín':[-34.5758,-58.5371],'San Andrés':[-34.5659,-58.5443],'Villa Ballester':[-34.5492,-58.5588],
  'Martínez':[-34.4948,-58.5165],'Florida':[-34.5329,-58.4909],'Munro':[-34.5304,-58.5244],
  'Boulogne':[-34.5012,-58.5672],'Grand Bourg':[-34.4835,-58.7288],'Villa Adelina':[-34.5203,-58.5445],
  'San Fernando':[-34.4417,-58.5543],'Victoria':[-34.4563,-58.5466],'Rincón de Milberg':[-34.4172,-58.5979],
  'El Talar':[-34.4721,-58.6540],'Benavídez':[-34.4152,-58.6868],'Tortuguitas':[-34.4707,-58.7590],
  'Olivos':[-34.5106,-58.4964],'Vicente López':[-34.5281,-58.4738],'Acassuso':[-34.4753,-58.4966],
  'Beccar':[-34.4641,-58.5348],'Virreyes':[-34.4605,-58.5722],'San Isidro':[-34.4708,-58.5286],
  'Don Torcuato':[-34.4938,-58.6273],
};
LOCALITIES.forEach(l => { const c = COORDS[l.name]; if(c){ l.lat = c[0]; l.lng = c[1]; } });

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
// Días en que el vendedor pasa por cada zona (unión de sus localidades). Se usa
// cuando solo conocemos el partido/zona y no la localidad puntual.
const ZONE_DAYS = (() => {
  const m = {};
  LOCALITIES.forEach(e => { const s = (m[e.zone] = m[e.zone] || new Set()); e.days.forEach(d => s.add(d)); });
  Object.keys(m).forEach(z => m[z] = [...m[z]].sort((a, b) => a - b));
  return m;
})();

function resolveZone(components, formatted){
  // Fuera de Buenos Aires / CABA no hay cobertura de zonas. Esto evita, por
  // ejemplo, que el departamento "Capital" de Tucumán o Córdoba matchee CABA.
  const inBA = /buenos aires/.test(normLoc(formatted));
  let partido = null;
  if(Array.isArray(components)){
    const prov = components.find(c => c.types && c.types.includes('administrative_area_level_1'));
    if(prov && !normLoc(prov.long_name).includes('buenos aires')) return null;
    // 1) Localidad puntual (barrio / localidad)
    const order = ['sublocality_level_1','sublocality','neighborhood','locality','administrative_area_level_2','administrative_area_level_1'];
    for(const type of order){
      for(const c of components){
        if(c.types && c.types.includes(type)){
          const hit = LOC_MAP[normLoc(c.long_name)];
          if(hit) return hit;
        }
      }
    }
    // 2) Partido -> zona aledaña (cubre localidades no listadas del municipio)
    const part = components.find(c => c.types && c.types.includes('administrative_area_level_2'));
    if(part){
      const z = PARTIDO_ZONE[normLoc(part.long_name).replace(/^partido de /, '')];
      if(z) partido = { name: part.long_name.replace(/^Partido de\s+/i, ''), zone: z, days: [] };
    }
  }
  if(inBA){
    const nf = ' ' + normLoc(formatted) + ' ';
    for(const { key, e } of LOC_KEYS){ if(nf.includes(' ' + key + ' ')) return e; }
  }
  return partido;   // si no hubo localidad puntual, cae en la zona del partido (o null)
}
function diasTexto(days){
  const names = days.slice().sort((a, b) => a - b).map(d => DIA_NOMBRE[d]);
  return names.length <= 1 ? (names[0] || '') : names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
}
// Días efectivos de visita: la localidad puntual si la hay; si solo hay
// partido/zona, los días en que el vendedor recorre esa zona.
function daysForMatch(match){
  if(!match) return [1,2,3,4,5];
  if(match.days && match.days.length) return match.days;
  return ZONE_DAYS[match.zone] || [1,2,3,4,5];
}
// Distancia en km (Haversine) y días de visita dentro de un radio del cliente.
function toLatLng(x){
  if(!x) return null;
  return { lat: typeof x.lat === 'function' ? x.lat() : x.lat, lng: typeof x.lng === 'function' ? x.lng() : x.lng };
}
function haversineKm(a, b){
  const R = 6371, toRad = x => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
// Días en que un vendedor pasa a menos de `km` de la ubicación del cliente.
function daysWithin(coords, km){
  if(!coords) return null;
  const near = LOCALITIES.filter(l => l.lat != null && haversineKm(coords, { lat:l.lat, lng:l.lng }) <= km);
  if(!near.length) return null;
  return { days: [...new Set(near.flatMap(l => l.days))].sort((a, b) => a - b), places: near.map(l => l.name) };
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
// Calendario mensual: sólo las fechas de los días que pasa el vendedor quedan
// disponibles (resaltadas); el resto se ve deshabilitado.
function renderPickupChips(allowedDays, containerId, onPick){
  const cont = document.getElementById(containerId || 'pickup-dates');
  if(!cont) return;
  const pick = onPick || (iso => { orderData.pickupDate = iso; });
  const today = new Date(); today.setHours(0,0,0,0);
  const minDate = new Date(today); minDate.setDate(minDate.getDate() + 1);   // desde mañana
  const view = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = null;

  function render(){
    cont.innerHTML = '';
    const head = document.createElement('div'); head.className = 'calp-head';
    const prev = document.createElement('button'); prev.type = 'button'; prev.className = 'calp-nav'; prev.textContent = '‹';
    prev.setAttribute('aria-label', 'Mes anterior');
    const title = document.createElement('span'); title.className = 'calp-title';
    title.textContent = `${MESES[view.getMonth()]} ${view.getFullYear()}`;
    const next = document.createElement('button'); next.type = 'button'; next.className = 'calp-nav'; next.textContent = '›';
    next.setAttribute('aria-label', 'Mes siguiente');
    prev.disabled = (view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth());
    prev.onclick = () => { view.setMonth(view.getMonth() - 1); render(); };
    next.onclick = () => { view.setMonth(view.getMonth() + 1); render(); };
    head.append(prev, title, next);
    cont.appendChild(head);

    const grid = document.createElement('div'); grid.className = 'calp-grid';
    ['Lu','Ma','Mi','Ju','Vi','Sá','Do'].forEach(d => {
      const s = document.createElement('span'); s.className = 'calp-dow'; s.textContent = d; grid.appendChild(s);
    });
    const firstDow = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;   // Lunes = 0
    for(let i = 0; i < firstDow; i++){ const e = document.createElement('span'); e.className = 'calp-cell empty'; grid.appendChild(e); }
    const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for(let day = 1; day <= dim; day++){
      const date = new Date(view.getFullYear(), view.getMonth(), day);
      const cell = document.createElement('button'); cell.type = 'button'; cell.className = 'calp-cell'; cell.textContent = day;
      if(allowedDays.includes(date.getDay()) && date >= minDate){
        const iso = isoDate(date);
        cell.classList.add('avail');
        if(selected === iso) cell.classList.add('sel');
        cell.setAttribute('aria-label', `${day} de ${MESES[view.getMonth()]} (disponible)`);
        cell.onclick = () => { selected = iso; pick(iso); render(); };
      } else {
        cell.disabled = true; cell.classList.add('off');
      }
      grid.appendChild(cell);
    }
    cont.appendChild(grid);
  }
  render();
}
function initPickup(){
  const note = document.getElementById('pickup-note');
  note.textContent = 'Ingresá tu dirección para ver las fechas disponibles de retiro.';
  note.classList.add('muted');
  orderData.pickupDate = null;
  renderPickupChips([1,2,3,4,5]);
}
function updatePickupForAddress(components, formatted, coords){
  const match = resolveZone(components, formatted);
  const note = document.getElementById('pickup-note');
  orderData.pickupDate = null;
  orderData.zone = match ? match.zone : null;
  const zoneVendors = match ? (VENDORS_BY_ZONE[match.zone] || []) : [];
  orderData.zoneVendors = zoneVendors;
  orderData.vendor = zoneVendors[0] || null;   // el primero es quien pasa a retirar
  const vendorTxt = orderData.vendor ? ` Te visita <strong>${orderData.vendor}</strong>.` : '';
  const prox = daysWithin(coords, 5);          // días de visita a <=5 km del cliente
  note.classList.remove('muted');
  if(prox){
    note.innerHTML = `Fechas de retiro disponibles cerca tuyo.${vendorTxt} Elegí una:`;
    renderPickupChips(prox.days);
  } else if(match){
    note.innerHTML = `Fechas de retiro disponibles en tu zona.${vendorTxt} Elegí una:`;
    renderPickupChips(daysForMatch(match));
  } else {
    note.classList.add('muted');
    note.textContent = 'Elegí una fecha de retiro y la coordinamos con un vendedor:';
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

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const toolSingular = t => (t.article || '').split(' ')[1] || t.name.toLowerCase();

/* ----- Render dinámico del detalle según herramienta y servicio -------- */
function renderDetail(){
  const t = current.tool, s = current.service;
  current.dirty = false;          // formulario recién generado = sin cambios
  current.draft = {};             // evita arrastrar el modelo elegido antes
  current.broken = 'no';
  current.sierraUso = null;       // qué hace con la sierra: melamina / madera / abro
  current.sierraMode = 'uno';
  current.sierraGroups = [{ qty:'1', teeth:'', scrapers:'', broken:'', model:'' }];
  document.getElementById('detail-title').textContent = SERVICE_LABEL[s];
  document.getElementById('detail-tool').textContent = t.name;
  const photo = document.getElementById('detail-photo');
  if(t.img){ photo.src = t.img; photo.hidden = false; } else { photo.hidden = true; }
  const box = document.getElementById('detail-fields');
  box.innerHTML = '';

  // ----- Mechas: cantidad + galería de modelos; la de bisagra habilita dientes rotos
  if(t.type === 'mechas'){
    box.appendChild(fieldHTML(`Cantidad de ${t.name.toLowerCase()}`,
      `<input type="number" min="1" value="1" id="d-qty" class="box-input half" inputmode="numeric">`, 'd-qty'));
    box.appendChild(buildPhotoSelect(`Modelo de ${t.name.toLowerCase()}`, MECHA_MODELS, onMechaModel));
    const bsec = document.createElement('div'); bsec.id = 'broken-section'; box.appendChild(bsec);
    return;
  }

  // ----- Sierras: "¿Qué haces con la sierra?" arriba; dientes rotos al final
  if(t.type === 'sierra'){
    box.appendChild(buildCustomSelect('¿Qué haces con la sierra?', USO_OPTIONS, onSierraUso, 'Elegí una opción'));
    const body = document.createElement('div'); body.id = 'detail-body'; box.appendChild(body);
    renderSierraSection();
    return;
  }

  // ----- Fresas: cantidad + modelo; "¿Tiene dientes rotos?" al final
  if(t.broken){
    box.appendChild(fieldHTML(`Cantidad de ${t.name.toLowerCase()}`,
      `<input type="number" min="1" value="1" id="d-qty" class="box-input half" inputmode="numeric">`, 'd-qty'));
    box.appendChild(fieldHTML(`Modelo de ${t.name.toLowerCase()}`,
      `<input type="text" id="d-model" class="box-input" placeholder="Ej: marca / medida">`, 'd-model'));
    const bsec = document.createElement('div'); bsec.id = 'broken-section'; box.appendChild(bsec);
    renderBrokenSection();
    return;
  }

  // ----- Simples (cuchillas, diamante, cabezales): cantidad + modelo -------
  box.appendChild(fieldHTML(`Cantidad de ${t.name.toLowerCase()}`,
    `<input type="number" min="1" value="1" id="d-qty" class="box-input half" inputmode="numeric">`, 'd-qty'));
  box.appendChild(fieldHTML(`Modelo de ${t.name.toLowerCase()}`,
    `<input type="text" id="d-model" class="box-input" placeholder="Ej: marca / medida">`, 'd-model'));
}

/* ----- Pregunta "¿Tiene dientes rotos?" (Sí / No) --------------------- */
function brokenQuestion(){
  const q = document.createElement('div');
  q.className = 'field';
  q.innerHTML = `<label>¿Tiene dientes rotos?</label>
    <div class="seg" role="group" aria-label="¿Tiene dientes rotos?">
      <button type="button" class="seg-btn ${current.broken==='si'?'active':''}" data-b="si" aria-pressed="${current.broken==='si'}">Sí</button>
      <button type="button" class="seg-btn ${current.broken==='no'?'active':''}" data-b="no" aria-pressed="${current.broken==='no'}">No</button>
    </div>`;
  q.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => setBroken(b.dataset.b)));
  return q;
}
function setBroken(val){
  if(val === current.broken) return;
  current.broken = val;
  current.dirty = true;
  // Sierras: los recuadros cambian (aparece "Cantidad de dientes rotos" por sierra)
  if(current.tool.type === 'sierra'){ renderSierraSection(); return; }
  renderBrokenSection();   // fresas y mechas
}

/* ----- "¿Tiene dientes rotos?" al final (fresas y mechas de bisagra) ---
   Aditivo: si dice que sí, suma un campo "Cantidad de dientes rotos".     */
function renderBrokenSection(){
  const sec = document.getElementById('broken-section');
  if(!sec) return;
  const t = current.tool;
  const show = t.type === 'mechas' ? current.draft.modelBroken : t.broken;
  sec.innerHTML = '';
  if(!show) return;
  sec.appendChild(brokenQuestion());
  if(current.broken === 'si'){
    sec.appendChild(fieldHTML('Cantidad de dientes rotos',
      `<input type="number" min="1" id="d-broken-teeth" class="box-input half" inputmode="numeric">`, 'd-broken-teeth'));
  }
}

/* ----- Mechas: modelo (galería) y dientes rotos si es de bisagra ------ */
function onMechaModel(m){
  current.draft.model = m.name;
  current.draft.modelImg = m.img;
  current.draft.modelBroken = !!m.broken;
  current.dirty = true;
  if(!m.broken){ current.broken = 'no'; }
  renderBrokenSection();
}

/* ----- Sección de sierras: uso arriba, "¿dientes rotos?" al final ------ */
function onSierraUso(text){
  current.sierraUso = USO_KEY[text] || null;
  current.sierraUsoLabel = text;
  current.dirty = true;
  renderSierraSection();        // muestra/oculta "Cantidad de rascadores" (Abro madera)
}

function renderSierraSection(){
  const section = document.getElementById('detail-body');
  if(!section) return;
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

  // Cuerpo: grupos (recuadros) + botón "+ sierra nueva" + total
  const body = document.createElement('div');
  body.id = 'sierra-body';
  section.appendChild(body);
  current.sierraGroups.forEach((g, i) => body.appendChild(buildSierraGroup(g, i, teethLabel)));
  if(current.sierraMode === 'varios'){
    const add = document.createElement('button');
    add.type = 'button'; add.className = 'btn-add'; add.id = 'add-sierra';
    add.innerHTML = '<span>+</span> sierra nueva';
    add.addEventListener('click', addSierraGroup);
    body.appendChild(add);
  }

  // "¿Tiene dientes rotos?" al final de todo
  section.appendChild(brokenQuestion());

  updateGrandTotal();
}

function buildSierraGroup(g, i, teethLabel){
  const varios  = current.sierraMode === 'varios';
  const abro    = current.sierraUso === 'abro';   // "Abro madera" => pide rascadores
  const broken  = current.broken === 'si';        // dientes rotos => pide cantidad
  const wrap = document.createElement('div');
  wrap.className = 'sierra-group' + (varios ? ' boxed' : '');
  wrap.dataset.idx = i;

  const head = varios
    ? `<div class="sg-head"><span class="sg-title">Sierra ${i+1}</span>${current.sierraGroups.length>1 ? '<button type="button" class="sg-remove" aria-label="Quitar sierra">✕</button>' : ''}</div>`
    : '';
  const scrapersField = abro
    ? `<div class="field"><label>Cantidad de rascadores</label>
         <input type="number" min="0" class="box-input half g-scrapers" inputmode="numeric">
         <span class="scrapers-total" aria-live="polite"></span></div>`
    : '';
  const brokenField = broken
    ? `<div class="field"><label>Cantidad de dientes rotos</label>
         <input type="number" min="0" class="box-input half g-broken" inputmode="numeric"></div>`
    : '';
  wrap.innerHTML = head +
    `<div class="field"><label>Cantidad de sierras</label>
       <input type="number" min="1" class="box-input half g-qty" inputmode="numeric"></div>
     <div class="field"><label>${teethLabel}</label>
       <input type="number" min="0" class="box-input half g-teeth" inputmode="numeric">
       <span class="teeth-total" aria-live="polite"></span></div>`
    + scrapersField + brokenField +
    `<div class="field"><label>Modelo de la sierra</label>
       <input type="text" class="box-input g-model" placeholder="Ej: marca / medida"></div>`;

  const qtyIn      = wrap.querySelector('.g-qty');
  const teethIn    = wrap.querySelector('.g-teeth');
  const modelIn    = wrap.querySelector('.g-model');
  const totalEl    = wrap.querySelector('.teeth-total');
  const scrapersIn = wrap.querySelector('.g-scrapers');
  const scrTotalEl = wrap.querySelector('.scrapers-total');
  const brokenIn   = wrap.querySelector('.g-broken');
  qtyIn.value = g.qty ?? ''; teethIn.value = g.teeth ?? ''; modelIn.value = g.model ?? '';
  if(scrapersIn) scrapersIn.value = g.scrapers ?? '';
  if(brokenIn)   brokenIn.value   = g.broken ?? '';

  // Reparación: comprar una nueva (se cuelga del campo de dientes)
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
    if(scrTotalEl){
      const r = parseInt(scrapersIn.value || '0', 10);
      scrTotalEl.textContent = (q > 0 && r > 0) ? `= ${q * r} rascadores en total` : '';
    }
  };
  const onInput = () => {
    g.qty = qtyIn.value; g.teeth = teethIn.value;
    if(scrapersIn) g.scrapers = scrapersIn.value;
    if(brokenIn)   g.broken   = brokenIn.value;
    computeTotal(); current.dirty = true; updateGrandTotal();
  };
  qtyIn.addEventListener('input', onInput);
  teethIn.addEventListener('input', onInput);
  if(scrapersIn) scrapersIn.addEventListener('input', onInput);
  if(brokenIn)   brokenIn.addEventListener('input', onInput);
  modelIn.addEventListener('input', () => { g.model = modelIn.value; current.dirty = true; });

  const rm = wrap.querySelector('.sg-remove');
  if(rm) rm.addEventListener('click', () => removeSierraGroup(i));

  computeTotal();               // total inicial sin marcar "dirty"
  return wrap;
}

function setSierraMode(mode){
  if(mode === current.sierraMode) return;
  current.sierraMode = mode;
  if(mode === 'uno') current.sierraGroups = [current.sierraGroups[0] || { qty:'1', teeth:'', scrapers:'', broken:'', model:'' }];
  current.dirty = true;
  renderSierraSection();
}

function addSierraGroup(){
  current.sierraGroups.push({ qty:'1', teeth:'', scrapers:'', broken:'', model:'' });
  current.dirty = true;
  renderSierraSection();
  // enfoca la cantidad del recuadro recién agregado
  const groups = document.querySelectorAll('#detail-body .sierra-group');
  groups[groups.length - 1]?.querySelector('.g-qty')?.focus();
}

function removeSierraGroup(i){
  if(current.sierraGroups.length <= 1) return;
  current.sierraGroups.splice(i, 1);
  current.dirty = true;
  renderSierraSection();
}

function updateGrandTotal(){
  const body = document.getElementById('sierra-body');
  if(!body) return;
  const total = current.sierraGroups.reduce((sum, g) => {
    const q = parseInt(g.qty || '0', 10), d = parseInt(g.teeth || '0', 10);
    return sum + (q > 0 && d > 0 ? q * d : 0);
  }, 0);
  let el = body.querySelector('.grand-total');
  if(total > 0 && current.sierraGroups.length > 1){
    if(!el){ el = document.createElement('p'); el.className = 'grand-total'; body.appendChild(el); }
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

/* ----- Dropdown personalizado animado (accesible por teclado) ----------
   onSelect(valor) opcional; si no se pasa, escribe en current.draft.model. */
let csSeq = 0;
function buildCustomSelect(labelText, options, onSelect, placeholder){
  const uid = 'cs' + (++csSeq);
  const ph = placeholder || 'Seleccioná una opción';
  const div = document.createElement('div');
  div.className = 'field';
  div.innerHTML = `<label id="${uid}-lbl">${labelText}</label>`;
  const sel = document.createElement('div');
  sel.className = 'cselect';
  sel.innerHTML = `
    <div class="cselect-trigger" role="combobox" tabindex="0" aria-haspopup="listbox"
         aria-expanded="false" aria-labelledby="${uid}-lbl ${uid}-val">
      <span class="cs-value placeholder" id="${uid}-val">${ph}</span>
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
    if(onSelect){ onSelect(op.textContent); }
    else { current.draft.model = op.textContent; current.dirty = true; }
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

/* ----- Selector de modelo con galería de fotos (mechas) --------------- */
function buildPhotoSelect(labelText, models, onSelect){
  const uid = 'ps' + (++csSeq);
  const div = document.createElement('div');
  div.className = 'field';
  div.innerHTML = `<label id="${uid}-lbl">${labelText}</label>`;
  const sel = document.createElement('div');
  sel.className = 'cselect pselect';
  sel.innerHTML = `
    <div class="cselect-trigger" role="button" tabindex="0" aria-haspopup="listbox"
         aria-expanded="false" aria-labelledby="${uid}-lbl ${uid}-val">
      <span class="cs-value placeholder" id="${uid}-val">Seleccioná un modelo</span>
      <span class="cs-arrow" aria-hidden="true">▾</span>
    </div>
    <div class="pselect-panel" role="listbox" aria-labelledby="${uid}-lbl">
      ${models.map((m, i) => `<button type="button" class="ps-option" role="option" aria-selected="false" data-i="${i}">
        <img src="${m.img}" alt="${m.name}" loading="lazy" onerror="this.style.display='none'">
        <span>${m.name}</span></button>`).join('')}
    </div>`;
  const trigger = sel.querySelector('.cselect-trigger');
  const value = sel.querySelector('.cs-value');
  const toggle = () => { const open = sel.classList.toggle('open'); trigger.setAttribute('aria-expanded', open); };
  const closeIt = () => { sel.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); };
  trigger.addEventListener('click', toggle);
  trigger.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown'){ e.preventDefault(); toggle(); }
    else if(e.key === 'Escape'){ closeIt(); }
  });
  sel.querySelectorAll('.ps-option').forEach(op => {
    op.addEventListener('click', () => {
      const m = models[+op.dataset.i];
      value.textContent = m.name; value.classList.remove('placeholder');
      sel.querySelectorAll('.ps-option').forEach(o => o.setAttribute('aria-selected', 'false'));
      op.setAttribute('aria-selected', 'true');
      onSelect(m); closeIt();
    });
  });
  div.appendChild(sel);
  return div;
}

/* ----- Leer el detalle y armar los ítems (devuelve array o null) ------- */
function readDetail(){
  const t = current.tool, s = current.service;

  // Sierras: un ítem por recuadro (uso + dientes + rascadores + dientes rotos)
  if(t.type === 'sierra'){
    if(!current.sierraUso){ alert('Elegí qué haces con la sierra.'); return null; }
    const abro = current.sierraUso === 'abro';
    const broken = current.broken === 'si';
    const items = [];
    for(let i = 0; i < current.sierraGroups.length; i++){
      const g = current.sierraGroups[i];
      const ref = current.sierraMode === 'varios' ? ` en el modelo ${i + 1}` : '';
      const qty = parseInt(g.qty || '0', 10);
      if(!qty || qty < 1){ alert(`Ingresá la cantidad de sierras${ref}.`); return null; }
      const teeth = parseInt(g.teeth || '0', 10);
      if(!teeth || teeth < 1){ alert(`Ingresá la cantidad de dientes${ref}.`); return null; }
      const item = {
        service:s, toolId:t.id, tool:t.name, quantity:qty,
        uso:current.sierraUsoLabel, usoKey:current.sierraUso,
        teeth, totalTeeth:teeth * qty,
      };
      if(abro){
        const scr = parseInt(g.scrapers || '0', 10);
        if(!scr || scr < 1){ alert(`Ingresá la cantidad de rascadores${ref}.`); return null; }
        item.scrapers = scr; item.totalScrapers = scr * qty;
      }
      if(broken){
        const br = parseInt(g.broken || '0', 10);
        if(!br || br < 1){ alert(`Ingresá la cantidad de dientes rotos${ref}.`); return null; }
        item.brokenTeeth = br; item.totalBroken = br * qty; item.broken = true;
      }
      const model = (g.model || '').trim();
      if(model) item.model = model;
      items.push(item);
    }
    return items;
  }

  // Mechas
  if(t.type === 'mechas'){
    const qty = parseInt(document.getElementById('d-qty')?.value || '0', 10);
    if(!qty || qty < 1){ alert('Ingresá una cantidad válida.'); return null; }
    if(!current.draft.model){ alert('Elegí un modelo.'); return null; }
    const item = { service:s, toolId:t.id, tool:t.name, quantity:qty, model:current.draft.model };
    if(current.draft.modelBroken && current.broken === 'si'){
      const bt = parseInt(document.getElementById('d-broken-teeth')?.value || '0', 10);
      if(!bt || bt < 1){ alert('Ingresá la cantidad de dientes rotos.'); return null; }
      item.brokenTeeth = bt; item.totalBroken = bt * qty; item.broken = true;
    }
    return [item];
  }

  // Simples (cuchillas, diamante, cabezales) y fresas
  const qty = parseInt(document.getElementById('d-qty')?.value || '0', 10);
  if(!qty || qty < 1){ alert('Ingresá una cantidad válida.'); return null; }
  const item = { service:s, toolId:t.id, tool:t.name, quantity:qty };
  const m = document.getElementById('d-model')?.value.trim();
  if(m) item.model = m;
  // Fresas: "¿Tiene dientes rotos?" al final (aditivo)
  if(t.broken && current.broken === 'si'){
    const bt = parseInt(document.getElementById('d-broken-teeth')?.value || '0', 10);
    if(!bt || bt < 1){ alert('Ingresá la cantidad de dientes rotos.'); return null; }
    item.brokenTeeth = bt; item.totalBroken = bt * qty; item.broken = true;
  }
  return [item];
}

function addToCart(){
  const items = readDetail();
  if(!items) return;
  cart.push(...items);
  refreshCartBadge(true);
  flash(items.length > 1 ? `${items.length} ítems agregados ✓` : 'Agregado al carrito ✓');
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
    const usoTxt   = it.usoKey ? (USO_SHORT[it.usoKey] || it.uso) : null;
    const teethTxt = it.teeth ? `${it.totalTeeth} dientes (${it.teeth}×${it.quantity})` : null;
    const scrapTxt = it.scrapers ? `${it.totalScrapers} rascadores (${it.scrapers}×${it.quantity})` : null;
    const brokenTxt = (it.broken && it.brokenTeeth) ? `${it.totalBroken} dientes rotos (${it.brokenTeeth}×${it.quantity})` : null;
    const sub = [SERVICE_LABEL[it.service], usoTxt, it.model, teethTxt, scrapTxt, brokenTxt]
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
  // Acá se enviaría `payload` al sistema comercial (backend).

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

/* ==========================  HABLAR CON UN VENDEDOR  ================== */
let chatData = { zone:null, vendor:null, motivo:null, day:null, days:[] };

// Detecta la zona (y su vendedor) a partir de la dirección del formulario, y
// muestra los días de visita para coordinar (misma lógica que el calendario).
function updateChatZone(components, formatted, coords){
  const match = resolveZone(components, formatted);
  chatData.zone = match ? match.zone : null;
  const vendors = match ? (VENDORS_BY_ZONE[match.zone] || []) : [];
  chatData.vendor = vendors[0] || null;
  chatData.day = null;
  const prox = daysWithin(coords, 5);
  chatData.days = prox ? prox.days : (match ? daysForMatch(match) : []);
  renderChatDays(match, prox);
}

// Días de visita en la ubicación del cliente (radio de 5 km, misma lógica que el retiro).
function renderChatDays(match, prox){
  const field = document.getElementById('chat-day-field');
  const note  = document.getElementById('chat-note');
  if(!field || !note) return;
  field.hidden = false;
  if(prox){
    note.classList.remove('muted');
    note.innerHTML = 'Fechas disponibles cerca tuyo. Elegí una para coordinar la visita:';
    renderPickupChips(prox.days, 'chat-dates', iso => { chatData.day = iso; });
  } else if(match){
    note.classList.remove('muted');
    note.innerHTML = 'Fechas disponibles en tu zona. Elegí una para coordinar la visita:';
    renderPickupChips(daysForMatch(match), 'chat-dates', iso => { chatData.day = iso; });
  } else {
    note.classList.add('muted');
    note.textContent = 'Elegí una fecha tentativa para coordinar la visita:';
    renderPickupChips([1,2,3,4,5], 'chat-dates', iso => { chatData.day = iso; });
  }
}

function sendVendorMessage(){
  const name = document.getElementById('chat-name').value.trim();
  const doc  = document.getElementById('chat-doc').value.trim();
  const addr = document.getElementById('chat-address').value.trim();
  const desc = document.getElementById('chat-desc').value.trim();
  const motivo = chatData.motivo;
  if(!name){ alert('Ingresá tu nombre o razón social.'); return; }
  if(!addr){ alert('Ingresá tu dirección.'); return; }
  if(!motivo){ alert('Elegí el motivo de consulta.'); return; }

  // Vendedor de la zona; si no hay zona, va a Emmanuel Capalbo.
  const known  = chatData.vendor && VENDOR_PHONES[chatData.vendor];
  const vendor = known ? chatData.vendor : FALLBACK_VENDOR;
  const phone  = known ? VENDOR_PHONES[chatData.vendor] : FALLBACK_PHONE;

  const dayLine = chatData.day
    ? `*Día solicitado:* ${formatDate(chatData.day)}`
    : (chatData.days.length ? `*Días de visita en tu zona:* ${diasTexto(chatData.days)}` : null);

  const msg = [
    'Hola! Quiero hablar con un vendedor.',
    `*Nombre / Razón social:* ${name}`,
    doc  ? `*CUIT / DNI:* ${doc}` : null,
    `*Dirección:* ${addr}`,
    chatData.zone ? `*Zona:* ${chatData.zone}` : null,
    `*Motivo:* ${motivo}`,
    dayLine,
    desc ? `*Descripción:* ${desc}` : null,
    orderData.clientNumber ? `*N° de cliente:* ${orderData.clientNumber}` : null,
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  flash(`Mensaje enviado a ${vendor} ✓`);
  clearChatForm();
}

function clearChatForm(){
  ['chat-name','chat-doc','chat-address','chat-desc'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  const map = document.getElementById('chat-map'); if(map) map.classList.remove('open');
  const val = document.querySelector('#chat-motivo .cs-value');
  if(val){ val.textContent = 'Seleccioná un motivo'; val.classList.add('placeholder'); }
  document.querySelectorAll('#chat-motivo .cs-option').forEach(o => o.setAttribute('aria-selected','false'));
  const dayField = document.getElementById('chat-day-field'); if(dayField) dayField.hidden = true;
  const dates = document.getElementById('chat-dates'); if(dates) dates.innerHTML = '';
  chatData = { zone:null, vendor:null, motivo:null, day:null, days:[] };
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
      const c = toLatLng(place.geometry.location);
      if(mapWrapId === 'log-map') updatePickupForAddress(place.address_components, input.value, c);
      else if(mapWrapId === 'chat-map') updateChatZone(place.address_components, input.value, c);
    }
  });
  // El Enter lo maneja el propio widget de Autocomplete (elige la 1ª sugerencia);
  // no agregamos un geocode manual para no competir con esa selección.
  // Al editar el texto a mano, las coordenadas dejan de coincidir: invalidarlas.
  input.addEventListener('input', () => {
    if(input.dataset.geo === '1'){ input.dataset.geo = ''; if(mapWrapId === 'log-map') orderData.coordinates = null; }
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
  // Las coordenadas del pedido son solo las del retiro (campo de logística).
  if(mapWrapId === 'log-map'){
    orderData.coordinates = typeof location.lat === 'function' ? { lat:location.lat(), lng:location.lng() } : location;
  }
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
      const c = toLatLng(loc);
      if(mapWrapId === 'log-map') updatePickupForAddress(res[0].address_components, input.value, c);
      else if(mapWrapId === 'chat-map') updateChatZone(res[0].address_components, input.value, c);
    } else {
      alert('No encontramos esa dirección. Probá con más detalle.');
    }
  });
}

function reverseGeocode(pos, mapWrapId){
  if(!geocoder) return;
  const loc = { lat: typeof pos.lat==='function'?pos.lat():pos.lat, lng: typeof pos.lng==='function'?pos.lng():pos.lng };
  if(mapWrapId === 'log-map') orderData.coordinates = loc;
  geocoder.geocode({ location:loc }, (res, status) => {
    if(status === 'OK' && res[0]){
      const input = mapWrapId === 'log-map'  ? document.getElementById('log-address')
                  : mapWrapId === 'reg-map'  ? document.getElementById('reg-address')
                  : mapWrapId === 'chat-map' ? document.getElementById('chat-address')
                  : document.getElementById('reg-ship');
      if(input){ input.value = res[0].formatted_address; orderData.address = input.value; input.dataset.geo = '1'; }
      fillPostalCode(mapWrapId, res[0].address_components);
      if(mapWrapId === 'log-map') updatePickupForAddress(res[0].address_components, res[0].formatted_address, loc);
      else if(mapWrapId === 'chat-map') updateChatZone(res[0].address_components, res[0].formatted_address, loc);
    }
  });
}

/* ==========================  INIT  ================================== */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cart-btn').addEventListener('click', renderCart);
  document.getElementById('detail-fields').addEventListener('input', () => { current.dirty = true; });
  setupAddressField('reg-address','reg-map');    // se encola si Maps aún no cargó
  setupAddressField('chat-address','chat-map');  // dirección del formulario de contacto
  refreshCartBadge();
  initMapsApi();                                 // por si Maps ya estaba disponible

  // "Hablar con un vendedor": desplegable de motivo de consulta
  const motivoBox = document.getElementById('chat-motivo');
  if(motivoBox){
    motivoBox.appendChild(buildCustomSelect('Motivo de consulta',
      ['Afilado', 'Reparación', 'Otro'], v => { chatData.motivo = v; }, 'Seleccioná un motivo'));
  }

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
