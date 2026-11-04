import {
    loginConGoogle,
    registrarConCorreo,
    loginConCorreo,
    cerrarSesion,
    escucharSesion,
    mensajeError,
    esAdmin
} from './services/authService.js';
import { crearPedido } from './services/orderService.js';
import { obtenerProductos } from './services/productService.js';
import { obtenerCategorias } from './services/categoryService.js';
import {
    agregarAlCarrito,
    obtenerCarrito,
    cambiarCantidadProducto,
    eliminarDelCarrito,
    vaciarCarrito,
    obtenerTotalCarrito,
    actualizarBadgeCarrito
} from './services/cartService.js';

// Evita que textos con símbolos como < > " ' rompan el HTML
const esc = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const dinero = (n) => `S/. ${Number(n).toFixed(2)}`;

// Quita tildes y mayúsculas para comparar textos
const norm = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Emoji que reemplaza a la foto cuando un producto no tiene imagen
const emojiDe = (categoria) => {
    const c = norm(categoria);
    if (c.includes('bebida')) return '🥤';
    if (c.includes('postre')) return '🍨';
    if (c.includes('hamburg') || c.includes('burger')) return '🍔';
    if (c.includes('acompa') || c.includes('papas')) return '🍟';
    if (c.includes('combo') || c.includes('pollo') || c.includes('promo')) return '🍗';
    return '🍽️';
};

document.addEventListener('DOMContentLoaded', () => {

    // Usuario que tiene la sesión iniciada (null si no hay nadie)
    let usuarioActual = null;

    /* ==========================================================================
       1. PANEL DEL CARRITO (ABRIR / CERRAR / DIBUJAR)
       ========================================================================== */
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const openCartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const btnVaciar = document.getElementById('btnVaciar');
    const btnFinalizar = document.getElementById('btnFinalizar');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalSpan = document.getElementById('cartTotal');

    const renderizarSidebarCarrito = () => {
        if (!cartItemsContainer) return;
        const cart = obtenerCarrito();

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <p>🛒 ¡Tu carrito está vacío!</p>
                    <small>Agrega productos de nuestra carta.</small>
                </div>`;
            if (cartTotalSpan) cartTotalSpan.textContent = dinero(0);
            if (btnFinalizar) btnFinalizar.disabled = true;
            if (btnVaciar) btnVaciar.style.display = 'none';
            return;
        }

        if (btnFinalizar) btnFinalizar.disabled = false;
        if (btnVaciar) btnVaciar.style.display = 'block';

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${esc(item.nombre)}</h4>
                    <p>${dinero(item.precio)} c/u</p>
                </div>
                <div class="cart-item-right">
                    <div class="cart-item-controls">
                        <button type="button" class="btn-qty" data-action="minus" data-id="${esc(item.id)}">-</button>
                        <span>${item.cantidad}</span>
                        <button type="button" class="btn-qty" data-action="plus" data-id="${esc(item.id)}">+</button>
                    </div>
                    <span class="cart-item-subtotal">${dinero(item.precio * item.cantidad)}</span>
                    <button type="button" class="btn-remove" data-action="remove" data-id="${esc(item.id)}">Quitar</button>
                </div>
            </div>
        `).join('');

        if (cartTotalSpan) cartTotalSpan.textContent = dinero(obtenerTotalCarrito());
    };

    const abrirCarrito = () => {
        renderizarSidebarCarrito();
        cartDrawer?.classList.add('open');
        cartOverlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const cerrarCarrito = () => {
        cartDrawer?.classList.remove('open');
        cartOverlay?.classList.remove('open');
        document.body.style.overflow = '';
    };

    // Un solo "oyente" para todos los botones del carrito
    cartItemsContainer?.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;

        if (action === 'minus') cambiarCantidadProducto(id, -1);
        if (action === 'plus') cambiarCantidadProducto(id, 1);
        if (action === 'remove') eliminarDelCarrito(id);

        renderizarSidebarCarrito();
    });

    openCartBtn?.addEventListener('click', abrirCarrito);
    closeCartBtn?.addEventListener('click', cerrarCarrito);
    cartOverlay?.addEventListener('click', cerrarCarrito);

    btnVaciar?.addEventListener('click', () => {
        if (confirm('¿Vaciar todo el carrito?')) {
            vaciarCarrito();
            renderizarSidebarCarrito();
        }
    });

    btnFinalizar?.addEventListener('click', () => {
        cerrarCarrito();
        document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Aviso pequeño al agregar productos
    const mostrarToast = (mensaje) => {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = mensaje;
        toast.classList.add('show');
        clearTimeout(mostrarToast.timer);
        mostrarToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    };

    /* ==========================================================================
       2. TARJETAS: SELECTOR DE CANTIDAD + BOTÓN AGREGAR
       ========================================================================== */
    const activarBotonesTarjetas = () => {
        document.querySelectorAll('.btn-card').forEach((button) => {
            if (button.dataset.listo) return; // evita duplicar
            button.dataset.listo = '1';

            // Construimos el selector de cantidad junto al botón
            const acciones = document.createElement('div');
            acciones.className = 'card-actions';
            const selector = document.createElement('div');
            selector.className = 'qty-selector';
            selector.innerHTML = `
                <button type="button" class="btn-qty" data-q="-1">-</button>
                <span class="qty-value">1</span>
                <button type="button" class="btn-qty" data-q="1">+</button>
            `;
            button.parentNode.insertBefore(acciones, button);
            acciones.append(selector, button);

            const qtyValue = selector.querySelector('.qty-value');

            selector.addEventListener('click', (e) => {
                const q = e.target.closest('button[data-q]');
                if (!q) return;
                const nueva = parseInt(qtyValue.textContent) + parseInt(q.dataset.q);
                qtyValue.textContent = Math.min(20, Math.max(1, nueva));
            });

            button.addEventListener('click', () => {
                const cardBody = button.closest('.card-body');
                const nombre = button.getAttribute('data-nombre') || cardBody.querySelector('h3').textContent;
                const precioText = button.getAttribute('data-precio') || cardBody.querySelector('.price').textContent;
                const precio = parseFloat(precioText.replace('S/.', '').trim());
                const id = button.getAttribute('data-id') || nombre.toLowerCase().replace(/\s+/g, '-');
                const cantidad = parseInt(qtyValue.textContent);

                agregarAlCarrito({ id, nombre, precio }, cantidad);
                renderizarSidebarCarrito();
                qtyValue.textContent = '1';
                mostrarToast(`✓ ${cantidad} x ${nombre} agregado al carrito`);
            });
        });
    };

    /* ==========================================================================
       3. MENÚ DESDE FIREBASE + FILTROS POR CATEGORÍA
       ========================================================================== */
    const menuContainer = document.getElementById('menuContainer');
    const filtersContainer = document.getElementById('categoryFilters');

    const renderizarFiltros = (categorias) => {
        if (!filtersContainer) return;
        if (categorias.length < 2) {
            filtersContainer.innerHTML = '';
            return;
        }
        filtersContainer.innerHTML = ['Todos', ...categorias].map((c, i) => `
            <button type="button" class="filter-chip${i === 0 ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>
        `).join('');
    };

    filtersContainer?.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        const cat = chip.dataset.cat;

        filtersContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c === chip));
        menuContainer.querySelectorAll('.card').forEach(card => {
            card.hidden = cat !== 'Todos' && card.dataset.categoria !== cat;
        });
    });

    const mostrarMenuRespaldo = () => {
        const plantilla = document.getElementById('menuFallback');
        if (plantilla) menuContainer.replaceChildren(plantilla.content.cloneNode(true));
    };

    const cargarProductosMenu = async () => {
        try {
            // Pedimos productos y categorías al mismo tiempo (más rápido)
            const [productos, categorias] = await Promise.all([
                obtenerProductos(),
                obtenerCategorias().catch(() => [])
            ]);

            if (!productos || productos.length === 0) {
                mostrarMenuRespaldo();
                return;
            }

            const nombresCategorias = categorias.map(c => c.nombre);

            // Productos sin categoría van a "Otros"
            const lista = productos.map(p => ({ ...p, categoria: p.categoria || 'Otros' }));

            // Solo mostramos categorías que tengan productos, en el orden del admin
            const usadas = new Set(lista.map(p => p.categoria));
            const orden = nombresCategorias.filter(n => usadas.has(n));
            [...usadas].forEach(n => { if (!orden.includes(n)) orden.push(n); });

            lista.sort((a, b) => orden.indexOf(a.categoria) - orden.indexOf(b.categoria));

            menuContainer.innerHTML = '';
            lista.forEach((prod) => {
                const media = prod.imagen
                    ? `<img src="${esc(prod.imagen)}" alt="${esc(prod.nombre)}" class="card-img" loading="lazy">`
                    : `<div class="card-img-placeholder card-emoji" aria-hidden="true">${emojiDe(prod.categoria)}</div>`;

                menuContainer.insertAdjacentHTML('beforeend', `
                    <article class="card" data-categoria="${esc(prod.categoria)}">
                        ${media}
                        <div class="card-body">
                            <h3>${esc(prod.nombre)}</h3>
                            <p>${esc(prod.descripcion || 'Sin descripción disponible.')}</p>
                            <span class="price">S/. ${(parseFloat(prod.precio) || 0).toFixed(2)}</span>
                            <button class="btn-card" data-id="${esc(prod.id)}" data-nombre="${esc(prod.nombre)}" data-precio="${prod.precio}">Agregar al carrito</button>
                        </div>
                    </article>
                `);
            });

            renderizarFiltros(orden);
        } catch (error) {
            console.warn('Usando el menú de respaldo (revisa las reglas de Firestore).');
            mostrarMenuRespaldo();
        } finally {
            activarBotonesTarjetas();
        }
    };

    /* ==========================================================================
       4. INICIO DE SESIÓN
       ========================================================================== */
    const loginModal = document.getElementById('loginModal');
    const openLoginBtn = document.getElementById('openLoginBtn');
    const closeLoginBtn = document.getElementById('closeLoginBtn');
    const btnGoogle = document.getElementById('btnGoogle');
    const authForm = document.getElementById('authForm');
    const authError = document.getElementById('authError');
    const authSubmit = document.getElementById('authSubmit');
    const grupoNombreAuth = document.getElementById('grupoNombreAuth');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    let modoAuth = 'login';

    const abrirLogin = () => loginModal?.classList.add('open');
    const cerrarLogin = () => {
        loginModal?.classList.remove('open');
        if (authError) authError.textContent = '';
    };

    openLoginBtn?.addEventListener('click', abrirLogin);
    closeLoginBtn?.addEventListener('click', cerrarLogin);
    loginModal?.addEventListener('click', (e) => {
        if (e.target === loginModal) cerrarLogin();
    });

    // Tecla Esc: cierra el carrito y el login
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarCarrito();
            cerrarLogin();
        }
    });

    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modoAuth = tab.dataset.modo;
            document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t === tab));
            grupoNombreAuth.style.display = modoAuth === 'registro' ? 'block' : 'none';
            authSubmit.textContent = modoAuth === 'registro' ? 'Crear cuenta' : 'Iniciar sesión';
            authError.textContent = '';
        });
    });

    btnGoogle?.addEventListener('click', async () => {
        authError.textContent = '';
        try {
            await loginConGoogle();
            cerrarLogin();
        } catch (err) {
            console.error(err);
            authError.textContent = mensajeError(err);
        }
    });

    authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.textContent = '';
        const email = document.getElementById('authEmail').value.trim();
        const password = document.getElementById('authPassword').value;
        const nombre = document.getElementById('authNombre').value.trim();

        if (!email || !password) {
            authError.textContent = 'Completa tu correo y contraseña.';
            return;
        }

        authSubmit.disabled = true;
        try {
            if (modoAuth === 'registro') {
                await registrarConCorreo(nombre, email, password);
                // Firebase avisa de la sesión antes de guardar el nombre, así que lo mostramos aquí
                if (nombre) {
                    userName.textContent = `Hola, ${nombre}`;
                    const inNombre = document.getElementById('nombre');
                    if (inNombre && !inNombre.value) inNombre.value = nombre;
                }
            } else {
                await loginConCorreo(email, password);
            }
            authForm.reset();
            cerrarLogin();
        } catch (err) {
            console.error(err);
            authError.textContent = mensajeError(err);
        } finally {
            authSubmit.disabled = false;
        }
    });

    logoutBtn?.addEventListener('click', () => cerrarSesion());

    // Reacciona cuando alguien entra o sale
    escucharSesion((user) => {
        usuarioActual = user;

        // El botón Panel Admin solo se muestra al administrador
        const adminItem = document.getElementById('adminItem');
        if (adminItem) adminItem.style.display = esAdmin(user) ? '' : 'none';

        if (user) {
            const nombre = user.displayName || user.email.split('@')[0];
            userName.textContent = `Hola, ${nombre}`;
            userMenu.style.display = 'flex';
            openLoginBtn.style.display = 'none';

            // Rellena el formulario de pedido con sus datos
            const inNombre = document.getElementById('nombre');
            const inEmail = document.getElementById('email');
            if (inNombre && !inNombre.value) inNombre.value = user.displayName || '';
            if (inEmail && !inEmail.value) inEmail.value = user.email;
        } else {
            userMenu.style.display = 'none';
            openLoginBtn.style.display = 'inline-block';
        }
    });

    /* ==========================================================================
       5. INICIALIZACIÓN
       ========================================================================== */
    actualizarBadgeCarrito();
    renderizarSidebarCarrito();
    cargarProductosMenu();

    /* ==========================================================================
       6. VALIDACIÓN Y CREACIÓN DE PEDIDOS
       ========================================================================== */
    const contactForm = document.getElementById('contactForm');
    const inputNombre = document.getElementById('nombre');
    const inputEmail = document.getElementById('email');
    const inputPedido = document.getElementById('pedido');

    const errorNombre = document.getElementById('errorNombre');
    const errorEmail = document.getElementById('errorEmail');
    const errorPedido = document.getElementById('errorPedido');
    const formSuccess = document.getElementById('formSuccess');

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let isValid = true;
            const carrito = obtenerCarrito();

            errorNombre.textContent = '';
            errorEmail.textContent = '';
            errorPedido.textContent = '';
            formSuccess.style.display = 'none';

            if (inputNombre.value.trim() === '') {
                errorNombre.textContent = 'El nombre es obligatorio.';
                isValid = false;
            } else if (inputNombre.value.trim().length < 3) {
                errorNombre.textContent = 'El nombre debe tener al menos 3 caracteres.';
                isValid = false;
            }

            if (inputEmail.value.trim() === '') {
                errorEmail.textContent = 'El correo electrónico es obligatorio.';
                isValid = false;
            } else if (!isValidEmail(inputEmail.value.trim())) {
                errorEmail.textContent = 'Por favor, ingresa un correo electrónico válido.';
                isValid = false;
            }

            // Si hay productos en el carrito, el mensaje pasa a ser opcional
            if (carrito.length === 0) {
                if (inputPedido.value.trim() === '') {
                    errorPedido.textContent = 'Agrega productos al carrito o escribe el detalle de tu pedido.';
                    isValid = false;
                } else if (inputPedido.value.trim().length < 10) {
                    errorPedido.textContent = 'El mensaje debe ser más detallado (mínimo 10 caracteres).';
                    isValid = false;
                }
            }

            if (!isValid) return;

            // Armamos el detalle con lo que hay en el carrito
            const notas = inputPedido.value.trim();
            const total = obtenerTotalCarrito();
            const resumen = carrito
                .map(i => `${i.cantidad}x ${i.nombre} (${dinero(i.precio * i.cantidad)})`)
                .join(', ');

            const detalle = carrito.length
                ? `${resumen} | Total: ${dinero(total)}${notas ? ' | Notas: ' + notas : ''}`
                : notas;

            const nuevoPedido = {
                cliente: inputNombre.value.trim(),
                email: inputEmail.value.trim(),
                detalle,
                productos: carrito.map(({ id, nombre, precio, cantidad }) => ({ id, nombre, precio, cantidad })),
                uid: usuarioActual ? usuarioActual.uid : null,
                total
            };

            try {
                await crearPedido(nuevoPedido);
                formSuccess.textContent = `¡Gracias por tu pedido, ${nuevoPedido.cliente}! Ya lo recibimos.`;
                formSuccess.style.display = 'block';
                contactForm.reset();
                vaciarCarrito();
                renderizarSidebarCarrito();

                // Si hay sesión iniciada, volvemos a rellenar sus datos
                if (usuarioActual) {
                    inputNombre.value = usuarioActual.displayName || '';
                    inputEmail.value = usuarioActual.email;
                }
            } catch (err) {
                console.error('Error al guardar pedido en Firebase:', err);
                formSuccess.textContent = 'No pudimos enviar tu pedido. Tu carrito sigue guardado, intenta de nuevo.';
                formSuccess.style.display = 'block';
            }
        });
    }

    /* ==========================================================================
       7. LIMPIEZA DE ERRORES EN TIEMPO REAL
       ========================================================================== */
    inputNombre?.addEventListener('input', () => {
        if (inputNombre.value.trim() !== '') errorNombre.textContent = '';
    });
    inputEmail?.addEventListener('input', () => {
        if (isValidEmail(inputEmail.value.trim())) errorEmail.textContent = '';
    });
    inputPedido?.addEventListener('input', () => {
        if (inputPedido.value.trim().length >= 10) errorPedido.textContent = '';
    });
});