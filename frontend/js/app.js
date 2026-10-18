/* ==========================================================
   1. Configuración
   ========================================================== */
// Ruta base de la API. Como esta página la sirve la misma API, la ruta es relativa.
const API = "/estudiantes/";

// Escala de notas usada para colorear y dibujar la barra. Cámbiala si usas otra (por ejemplo 10).
const ESCALA_MAX = 5;

/* ==========================================================
   2. Estado y utilidades
   ========================================================== */
let editandoId = null;
let temporizador = null;

const $ = (id) => document.getElementById(id);

function avisar(texto, esError) {
  const el = $("aviso");
  el.textContent = texto;
  el.className = "aviso" + (esError ? " error" : "");
  el.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { el.hidden = true; }, 3500);
}

function marcarEstado(ok, texto) {
  $("punto").className = "punto " + (ok ? "ok" : "mal");
  $("estado-texto").textContent = texto;
}

/* ==========================================================
   3. Comunicación con la API
   ========================================================== */
// Convierte el error de la API en un texto legible
function textoDeError(datos, estado) {
  if (datos && Array.isArray(datos.detail)) {
    return datos.detail.map((d) => {
      const campo = d.loc ? d.loc[d.loc.length - 1] : "dato";
      return campo + ": " + d.msg;
    }).join(". ");
  }
  if (datos && typeof datos.detail === "string") return datos.detail;
  return "La API respondió con el error " + estado + ".";
}

async function llamar(url, opciones) {
  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch (e) {
    marcarEstado(false, "No se puede conectar con la API");
    throw new Error("No se pudo conectar con la API. Revisa que uvicorn siga corriendo.");
  }

  let datos = null;
  try { datos = await respuesta.json(); } catch (e) { /* sin cuerpo */ }

  if (!respuesta.ok) throw new Error(textoDeError(datos, respuesta.status));
  return datos;
}

/* ==========================================================
   4. Tabla
   ========================================================== */
function colorDeNota(valor) {
  const proporcion = valor / ESCALA_MAX;
  if (proporcion >= 0.8) return "var(--verde)";
  if (proporcion >= 0.6) return "var(--ambar)";
  return "var(--rojo)";
}

function crearCelda(clase, contenido) {
  const td = document.createElement("td");
  if (clase) td.className = clase;
  if (contenido !== undefined) td.textContent = contenido;
  return td;
}

function pintarTabla(estudiantes) {
  const cuerpo = $("cuerpo");
  cuerpo.replaceChildren();
  $("vacio").hidden = estudiantes.length > 0;

  estudiantes.forEach((e) => {
    const fila = document.createElement("tr");
    if (e.id === editandoId) fila.className = "fila-activa";

    fila.appendChild(crearCelda("id", e.id));
    fila.appendChild(crearCelda("nombre", e.nombre));
    fila.appendChild(crearCelda("", e.grado));

    // Promedio con barra de color
    const valor = Number(e.promedio);
    const celdaNota = crearCelda("");
    const nota = document.createElement("div");
    nota.className = "nota";

    const numero = document.createElement("b");
    numero.textContent = valor.toFixed(2);

    const barra = document.createElement("div");
    barra.className = "barra";
    const relleno = document.createElement("i");
    relleno.style.width = Math.min(100, (valor / ESCALA_MAX) * 100) + "%";
    relleno.style.background = colorDeNota(valor);
    barra.appendChild(relleno);

    nota.append(numero, barra);
    celdaNota.appendChild(nota);
    fila.appendChild(celdaNota);

    // Botones de la fila
    const acciones = crearCelda("acciones");

    const btnEditar = document.createElement("button");
    btnEditar.className = "btn-mini";
    btnEditar.type = "button";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => empezarEdicion(e));

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn-mini peligro";
    btnEliminar.type = "button";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => eliminar(e));

    acciones.append(btnEditar, btnEliminar);
    fila.appendChild(acciones);

    cuerpo.appendChild(fila);
  });

  // Resumen
  $("total").textContent = estudiantes.length;
  if (estudiantes.length) {
    const suma = estudiantes.reduce((acc, e) => acc + Number(e.promedio), 0);
    $("media").textContent = (suma / estudiantes.length).toFixed(2);
  } else {
    $("media").textContent = "–";
  }
}

/* ==========================================================
   5. Formulario
   ========================================================== */
function mostrarErrorForm(texto) {
  const el = $("mensaje-form");
  el.textContent = texto;
  el.hidden = !texto;
}

function limpiarForm() {
  editandoId = null;
  $("nombre").value = "";
  $("grado").value = "";
  $("promedio").value = "";
  $("titulo-form").textContent = "Nuevo estudiante";
  $("btn-guardar").textContent = "Registrar estudiante";
  $("btn-cancelar").hidden = true;
  $("panel-form").classList.remove("editando");
  mostrarErrorForm("");
}

function empezarEdicion(e) {
  editandoId = e.id;
  $("nombre").value = e.nombre;
  $("grado").value = e.grado;
  $("promedio").value = Number(e.promedio).toFixed(2);
  $("titulo-form").textContent = "Editando al estudiante " + e.id;
  $("btn-guardar").textContent = "Guardar cambios";
  $("btn-cancelar").hidden = false;
  $("panel-form").classList.add("editando");
  mostrarErrorForm("");
  $("nombre").focus();
  cargar();
}

/* ==========================================================
   6. Operaciones CRUD
   ========================================================== */
// READ
async function cargar() {
  try {
    const lista = await llamar(API);
    marcarEstado(true, "API conectada");
    pintarTabla(lista);
  } catch (e) {
    avisar(e.message, true);
  }
}

// CREATE y UPDATE
async function guardar() {
  mostrarErrorForm("");
  const nombre = $("nombre").value.trim();
  const grado = $("grado").value;
  const promedio = $("promedio").value;

  if (!nombre || grado === "" || promedio === "") {
    mostrarErrorForm("Completa nombre, grado y promedio.");
    return;
  }

  const cuerpo = JSON.stringify({
    nombre: nombre,
    grado: grado,        // se envía tal cual: Pydantic valida el tipo
    promedio: promedio
  });

  const opciones = {
    method: editandoId ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: cuerpo
  };
  const url = editandoId ? API + editandoId : API;

  try {
    const datos = await llamar(url, opciones);
    avisar(datos.mensaje + (datos.id ? " (ID " + datos.id + ")" : ""));
    limpiarForm();
    cargar();
  } catch (e) {
    mostrarErrorForm(e.message);
  }
}

// DELETE
async function eliminar(e) {
  if (!confirm("¿Eliminar a " + e.nombre + "? Esta acción no se puede deshacer.")) return;
  try {
    const datos = await llamar(API + e.id, { method: "DELETE" });
    avisar(datos.mensaje);
    if (editandoId === e.id) limpiarForm();
    cargar();
  } catch (err) {
    avisar(err.message, true);
  }
}

/* ==========================================================
   7. Eventos e inicio
   ========================================================== */
$("btn-guardar").addEventListener("click", guardar);
$("btn-cancelar").addEventListener("click", () => { limpiarForm(); cargar(); });

["nombre", "grado", "promedio"].forEach((id) => {
  $(id).addEventListener("keydown", (ev) => { if (ev.key === "Enter") guardar(); });
});

cargar();