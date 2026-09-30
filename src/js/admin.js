import { crearProducto, obtenerProductos, actualizarProducto, eliminarProducto } from './services/productService.js';
import { crearCategoria, obtenerCategorias, eliminarCategoria } from './services/categoryService.js';
import { obtenerPedidos, actualizarEstadoPedido, eliminarPedido } from './services/orderService.js';

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. FUNCIONES DE CARGA (CRUD READ)
       ========================================================================== */
    const cargarProductos = async () => {
        const productos = await obtenerProductos();
        const tbody = document.getElementById('tbodyProductos');
        if (!tbody) return;
        tbody.innerHTML = '';

        productos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nombre}</td>
                <td>S/. ${parseFloat(p.precio).toFixed(2)}</td>
                <td>${p.descripcion}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="editarProd('${p.id}', '${p.nombre}', '${p.precio}', '${p.descripcion}', '${p.imagen || ''}')">Editar</button>
                    <button class="btn-action btn-delete" onclick="borrarProd('${p.id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    const cargarCategorias = async () => {
        const categorias = await obtenerCategorias();
        const tbody = document.getElementById('tbodyCategorias');
        if (!tbody) return;
        tbody.innerHTML = '';

        categorias.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id}</td>
                <td>${c.nombre}</td>
                <td>
                    <button class="btn-action btn-delete" onclick="borrarCat('${c.id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    const cargarPedidos = async () => {
        const pedidos = await obtenerPedidos();
        const tbody = document.getElementById('tbodyPedidos');
        if (!tbody) return;
        tbody.innerHTML = '';

        pedidos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.fecha || 'N/A'}</td>
                <td>${p.cliente}</td>
                <td>${p.email}</td>
                <td>${p.detalle}</td>
                <td><strong>${p.estado || 'Pendiente'}</strong></td>
                <td>
                    <button class="btn-action btn-edit" onclick="cambiarEstadoPedido('${p.id}', 'Completado')">✓ Entregado</button>
                    <button class="btn-action btn-delete" onclick="borrarPedido('${p.id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    /* ==========================================================================
       2. EVENTOS Y FORMULARIOS
       ========================================================================== */
    const formProducto = document.getElementById('formProductoAdmin');
    const prodIdInput = document.getElementById('prodId');

    if (formProducto) {
        formProducto.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = prodIdInput.value;
            const datos = {
                nombre: document.getElementById('pNombre').value.trim(),
                precio: parseFloat(document.getElementById('pPrecio').value),
                imagen: document.getElementById('pImagen').value.trim(),
                descripcion: document.getElementById('pDescripcion').value.trim()
            };

            if (id) {
                await actualizarProducto(id, datos);
            } else {
                await crearProducto(datos);
            }

            formProducto.reset();
            prodIdInput.value = '';
            cargarProductos();
        });
    }

    const formCat = document.getElementById('formCatAdmin');
    if (formCat) {
        formCat.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('cNombre').value.trim();
            if (nombre) {
                await crearCategoria({ nombre });
                formCat.reset();
                cargarCategorias();
            }
        });
    }

    /* ==========================================================================
       3. FUNCIONES GLOBALES PARA BOTONES DE LAS TABLAS
       ========================================================================== */
    window.editarProd = (id, nombre, precio, descripcion, imagen) => {
        prodIdInput.value = id;
        document.getElementById('pNombre').value = nombre;
        document.getElementById('pPrecio').value = precio;
        document.getElementById('pDescripcion').value = descripcion;
        document.getElementById('pImagen').value = imagen;
    };

    window.borrarProd = async (id) => {
        if (confirm('¿Eliminar este producto?')) {
            await eliminarProducto(id);
            cargarProductos();
        }
    };

    window.borrarCat = async (id) => {
        if (confirm('¿Eliminar esta categoría?')) {
            await eliminarCategoria(id);
            cargarCategorias();
        }
    };

    window.cambiarEstadoPedido = async (id, estado) => {
        await actualizarEstadoPedido(id, estado);
        cargarPedidos();
    };

    window.borrarPedido = async (id) => {
        if (confirm('¿Eliminar este pedido?')) {
            await eliminarPedido(id);
            cargarPedidos();
        }
    };

    /* ==========================================================================
       4. INICIALIZACIÓN (AL FINAL)
       ========================================================================== */
    cargarProductos();
    cargarCategorias();
    cargarPedidos();
});