import { crearProducto, obtenerProductos, actualizarProducto, eliminarProducto } from './services/productService.js';
import { crearCategoria, obtenerCategorias, eliminarCategoria } from './services/categoryService.js';
import { obtenerPedidos, actualizarEstadoPedido, eliminarPedido } from './services/orderService.js';
import { escucharSesion, esAdmin } from './services/authService.js';

// Evita que textos con símbolos como < > " ' rompan el HTML o ejecuten código
const esc = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const norm = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/* ==========================================================================
   MENÚ DE EJEMPLO (se carga con el botón del panel)
   ========================================================================== */
const CATEGORIAS_EJEMPLO = ['Combos', 'Pollo', 'Hamburguesas', 'Acompañamientos', 'Bebidas', 'Postres'];

const PRODUCTOS_EJEMPLO = [
    // Combos
    { nombre: 'Combo Personal Fring', precio: 12.90, categoria: 'Combos', descripcion: '2 piezas de pollo crujiente, papas regulares y gaseosa personal.' },
    { nombre: 'Combo Pareja', precio: 18.90, categoria: 'Combos', descripcion: '4 piezas de pollo, papas medianas, ensalada coleslaw y 2 bebidas.' },
    { nombre: 'Combo Familiar Gustavo', precio: 24.90, categoria: 'Combos', descripcion: '12 piezas de pollo crujiente, papas fritas familiares, ensalada coleslaw y 4 bebidas.' },
    // Pollo
    { nombre: 'Pollo Frito Clásico (2 piezas)', precio: 10.90, categoria: 'Pollo', descripcion: 'Dos piezas de pollo frito con nuestra receta secreta de 11 especias.' },
    { nombre: 'Alitas Crujientes x8', precio: 14.50, categoria: 'Pollo', descripcion: 'Ocho alitas bañadas en salsa BBQ o picante, a tu elección.' },
    { nombre: 'Tiras de Pollo Crocante', precio: 11.90, categoria: 'Pollo', descripcion: 'Tiras de pechuga empanizadas con dos salsas para acompañar.' },
    // Hamburguesas
    { nombre: 'Pollos Burger Suprema', precio: 9.90, categoria: 'Hamburguesas', descripcion: 'Filete de pechuga empanizada, queso cheddar, lechuga fresca y nuestra salsa secreta.' },
    { nombre: 'Burger Clásica Fring', precio: 8.50, categoria: 'Hamburguesas', descripcion: 'Pechuga crujiente, tomate, lechuga y mayonesa de la casa.' },
    { nombre: 'Burger Picante', precio: 10.50, categoria: 'Hamburguesas', descripcion: 'Pechuga crujiente, jalapeños, queso pepper jack y salsa picante.' },
    // Acompañamientos
    { nombre: 'Papas Estilo Hermanos', precio: 4.50, categoria: 'Acompañamientos', descripcion: 'Papas sazonadas con pimentón dulce y especias de la casa, súper crujientes.' },
    { nombre: 'Ensalada Coleslaw', precio: 3.50, categoria: 'Acompañamientos', descripcion: 'Repollo y zanahoria en aderezo cremoso, fresca y ligera.' },
    { nombre: 'Aros de Cebolla', precio: 5.50, categoria: 'Acompañamientos', descripcion: 'Aros de cebolla empanizados y dorados, con salsa ranch.' },
    // Bebidas
    { nombre: 'Gaseosa Personal', precio: 3.00, categoria: 'Bebidas', descripcion: 'Botella personal de 500 ml, bien fría.' },
    { nombre: 'Limonada Frozen', precio: 5.50, categoria: 'Bebidas', descripcion: 'Limonada helada con hierbabuena, 500 ml.' },
    { nombre: 'Chicha Morada 500 ml', precio: 4.50, categoria: 'Bebidas', descripcion: 'Chicha morada casera con piña y canela.' },
    { nombre: 'Agua Mineral', precio: 2.50, categoria: 'Bebidas', descripcion: 'Agua mineral sin gas, 500 ml.' },
    // Postres
    { nombre: 'Helado Sundae', precio: 5.90, categoria: 'Postres', descripcion: 'Helado de vainilla con salsa de chocolate o fresa.' },
    { nombre: 'Brownie con Helado', precio: 7.50, categoria: 'Postres', descripcion: 'Brownie tibio de chocolate con una bola de helado de vainilla.' }
];

document.addEventListener('DOMContentLoaded', () => {

    const adminMain = document.getElementById('adminMain');
    const adminCheck = document.getElementById('adminCheck');
    const selectCategoria = document.getElementById('pCategoria');

    // Guardamos lo cargado para editar sin pasar datos por el HTML
    let productosCargados = [];

    /* ==========================================================================
       1. FUNCIONES DE CARGA (CRUD READ)
       ========================================================================== */
    const llenarSelectCategorias = (categorias) => {
        if (!selectCategoria) return;
        const actual = selectCategoria.value;
        selectCategoria.innerHTML = '<option value="">Sin categoría</option>' +
            categorias.map(c => `<option value="${esc(c.nombre)}">${esc(c.nombre)}</option>`).join('');
        selectCategoria.value = actual;
    };

    const cargarProductos = async () => {
        const tbody = document.getElementById('tbodyProductos');
        if (!tbody) return;

        try {
            productosCargados = await obtenerProductos();
        } catch (err) {
            console.error('Error al cargar productos:', err);
            tbody.innerHTML = '<tr><td colspan="5">No se pudieron cargar los productos.</td></tr>';
            return;
        }

        if (productosCargados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Aún no hay productos.</td></tr>';
            return;
        }

        tbody.innerHTML = productosCargados.map(p => `
            <tr>
                <td>${esc(p.nombre)}</td>
                <td>S/. ${(parseFloat(p.precio) || 0).toFixed(2)}</td>
                <td>${esc(p.categoria || '—')}</td>
                <td>${esc(p.descripcion)}</td>
                <td>
                    <button type="button" class="btn-action btn-edit" data-action="editar-prod" data-id="${esc(p.id)}">Editar</button>
                    <button type="button" class="btn-action btn-delete" data-action="borrar-prod" data-id="${esc(p.id)}">Eliminar</button>
                </td>
            </tr>
        `).join('');
    };

    const cargarCategorias = async () => {
        const tbody = document.getElementById('tbodyCategorias');

        let categorias = [];
        try {
            categorias = await obtenerCategorias();
        } catch (err) {
            console.error('Error al cargar categorías:', err);
            if (tbody) tbody.innerHTML = '<tr><td colspan="3">No se pudieron cargar las categorías.</td></tr>';
            return;
        }

        llenarSelectCategorias(categorias);
        if (!tbody) return;

        if (categorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">Aún no hay categorías.</td></tr>';
            return;
        }

        tbody.innerHTML = categorias.map(c => `
            <tr>
                <td>${esc(c.id)}</td>
                <td>${esc(c.nombre)}</td>
                <td>
                    <button type="button" class="btn-action btn-delete" data-action="borrar-cat" data-id="${esc(c.id)}">Eliminar</button>
                </td>
            </tr>
        `).join('');
    };

    const cargarPedidos = async () => {
        const tbody = document.getElementById('tbodyPedidos');
        if (!tbody) return;

        let pedidos = [];
        try {
            pedidos = await obtenerPedidos();
        } catch (err) {
            console.error('Error al cargar pedidos:', err);
            tbody.innerHTML = '<tr><td colspan="6">No se pudieron cargar los pedidos.</td></tr>';
            return;
        }

        if (pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Aún no hay pedidos.</td></tr>';
            return;
        }

        tbody.innerHTML = pedidos.map(p => {
            const estado = p.estado || 'Pendiente';
            const entregado = estado === 'Completado';
            return `
                <tr>
                    <td>${esc(p.fecha || 'N/A')}</td>
                    <td>${esc(p.cliente)}</td>
                    <td>${esc(p.email)}</td>
                    <td>${esc(p.detalle)}</td>
                    <td><strong>${esc(estado)}</strong></td>
                    <td>
                        ${entregado ? '' : `<button type="button" class="btn-action btn-edit" data-action="entregar-pedido" data-id="${esc(p.id)}">✓ Entregado</button>`}
                        <button type="button" class="btn-action btn-delete" data-action="borrar-pedido" data-id="${esc(p.id)}">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    /* ==========================================================================
       2. FORMULARIOS
       ========================================================================== */
    const formProducto = document.getElementById('formProductoAdmin');
    const prodIdInput = document.getElementById('prodId');
    const btnGuardarProd = document.getElementById('btnGuardarProd');

    formProducto?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = prodIdInput.value;
        const datos = {
            nombre: document.getElementById('pNombre').value.trim(),
            precio: parseFloat(document.getElementById('pPrecio').value),
            categoria: selectCategoria ? selectCategoria.value : '',
            imagen: document.getElementById('pImagen').value.trim(),
            descripcion: document.getElementById('pDescripcion').value.trim()
        };

        if (!datos.nombre || isNaN(datos.precio) || datos.precio < 0) {
            alert('Revisa el nombre y el precio del producto.');
            return;
        }

        btnGuardarProd.disabled = true;
        try {
            if (id) {
                await actualizarProducto(id, datos);
            } else {
                await crearProducto(datos);
            }
            formProducto.reset();
            prodIdInput.value = '';
            btnGuardarProd.textContent = 'Guardar / Actualizar Producto';
            await cargarProductos();
        } catch (err) {
            console.error('Error al guardar producto:', err);
            alert('No se pudo guardar el producto. Revisa la consola (F12).');
        } finally {
            btnGuardarProd.disabled = false;
        }
    });

    const formCat = document.getElementById('formCatAdmin');
    formCat?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('cNombre').value.trim();
        if (!nombre) return;

        try {
            await crearCategoria({ nombre });
            formCat.reset();
            await cargarCategorias();
        } catch (err) {
            console.error('Error al crear categoría:', err);
            alert('No se pudo crear la categoría. Revisa la consola (F12).');
        }
    });

    /* ==========================================================================
       3. CARGAR MENÚ DE EJEMPLO
       ========================================================================== */
    const btnSeed = document.getElementById('btnSeed');

    btnSeed?.addEventListener('click', async () => {
        if (!confirm('Se crearán las categorías y los productos de ejemplo que no existan todavía. Tus productos actuales no se borran. ¿Continuar?')) return;

        btnSeed.disabled = true;
        const textoOriginal = btnSeed.textContent;
        btnSeed.textContent = 'Cargando…';

        try {
            const categoriasActuales = (await obtenerCategorias()).map(c => norm(c.nombre));
            const productosActuales = await obtenerProductos();

            let catsCreadas = 0;
            for (const nombre of CATEGORIAS_EJEMPLO) {
                if (!categoriasActuales.includes(norm(nombre))) {
                    await crearCategoria({ nombre });
                    catsCreadas++;
                }
            }

            let creados = 0;
            let asignados = 0;
            for (const ejemplo of PRODUCTOS_EJEMPLO) {
                const existente = productosActuales.find(p => norm(p.nombre) === norm(ejemplo.nombre));
                if (!existente) {
                    await crearProducto({ ...ejemplo, imagen: '' });
                    creados++;
                } else if (!existente.categoria) {
                    // El producto ya existía sin categoría: solo se la asignamos
                    await actualizarProducto(existente.id, { categoria: ejemplo.categoria });
                    asignados++;
                }
            }

            await cargarCategorias();
            await cargarProductos();
            alert(`Listo: ${creados} productos nuevos, ${asignados} existentes con categoría asignada y ${catsCreadas} categorías nuevas.`);
        } catch (err) {
            console.error('Error al cargar el menú de ejemplo:', err);
            alert('No se pudo completar la carga. Revisa la consola (F12).');
        } finally {
            btnSeed.disabled = false;
            btnSeed.textContent = textoOriginal;
        }
    });

    /* ==========================================================================
       4. BOTONES DE LAS TABLAS (UN SOLO OYENTE, SIN FUNCIONES GLOBALES)
       ========================================================================== */
    adminMain?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;

        try {
            if (action === 'editar-prod') {
                const p = productosCargados.find(x => x.id === id);
                if (!p) return;
                prodIdInput.value = p.id;
                document.getElementById('pNombre').value = p.nombre ?? '';
                document.getElementById('pPrecio').value = p.precio ?? '';
                document.getElementById('pDescripcion').value = p.descripcion ?? '';
                document.getElementById('pImagen').value = p.imagen ?? '';

                if (selectCategoria) {
                    const cat = p.categoria || '';
                    // Si la categoría ya no existe en la lista, la agregamos para no perderla
                    if (cat && ![...selectCategoria.options].some(o => o.value === cat)) {
                        selectCategoria.insertAdjacentHTML('beforeend', `<option value="${esc(cat)}">${esc(cat)}</option>`);
                    }
                    selectCategoria.value = cat;
                }

                btnGuardarProd.textContent = 'Actualizar Producto';
                formProducto.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            if (action === 'borrar-prod' && confirm('¿Eliminar este producto?')) {
                await eliminarProducto(id);
                await cargarProductos();
            }

            if (action === 'borrar-cat' && confirm('¿Eliminar esta categoría?')) {
                await eliminarCategoria(id);
                await cargarCategorias();
            }

            if (action === 'entregar-pedido') {
                await actualizarEstadoPedido(id, 'Completado');
                await cargarPedidos();
            }

            if (action === 'borrar-pedido' && confirm('¿Eliminar este pedido?')) {
                await eliminarPedido(id);
                await cargarPedidos();
            }
        } catch (err) {
            console.error('Error en la acción del panel:', err);
            alert('No se pudo completar la acción. Revisa la consola (F12).');
        }
    });

    /* ==========================================================================
       5. CANDADO DE ADMINISTRADOR E INICIALIZACIÓN
       ========================================================================== */
    let panelIniciado = false;

    escucharSesion(async (user) => {
        if (esAdmin(user)) {
            adminCheck.style.display = 'none';
            adminMain.style.display = 'block';

            // Evita cargar los datos dos veces si Firebase avisa más de una vez
            if (!panelIniciado) {
                panelIniciado = true;
                await cargarCategorias(); // primero, para llenar el selector
                cargarProductos();
                cargarPedidos();
            }
        } else {
            adminMain.style.display = 'none';
            adminCheck.style.display = 'block';
            adminCheck.textContent = 'Acceso restringido. Volviendo a la tienda…';
            setTimeout(() => { window.location.href = '../../index.html'; }, 1500);
        }
    });
});