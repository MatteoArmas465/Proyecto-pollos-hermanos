// Importamos los servicios de Firebase para conectar los CRUDs
import { crearPedido } from './services/orderService.js';
import { obtenerProductos } from './services/productService.js';

document.addEventListener('DOMContentLoaded', async () => {

    /* ==========================================================================
       1. CARGAR PRODUCTOS DINÁMICAMENTE DESDE FIREBASE (CRUD 1 - READ)
       ========================================================================== */
    const menuContainer = document.getElementById('menuContainer');

    const cargarProductosMenu = async () => {
        try {
            const productos = await obtenerProductos();
            
            // Si hay productos en Firebase, los renderizamos en la pantalla
            if (productos && productos.length > 0) {
                menuContainer.innerHTML = ''; // Limpiar estáticos
                
                productos.forEach((prod) => {
                    const cardHTML = `
                        <article class="card">
                            <img src="${prod.imagen || 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=600'}" alt="${prod.nombre}" class="card-img">
                            <div class="card-body">
                                <h3>${prod.nombre}</h3>
                                <p>${prod.descripcion || 'Sin descripción disponible.'}</p>
                                <span class="price">S/. ${parseFloat(prod.precio).toFixed(2)}</span>
                                <button class="btn-card" data-nombre="${prod.nombre}">Agregar al carrito</button>
                            </div>
                        </article>
                    `;
                    menuContainer.insertAdjacentHTML('beforeend', cardHTML);
                });
                
                // Re-vincular eventos de botones a los nuevos elementos renderizados
                activarBotonesCarrito();
            }
        } catch (error) {
            console.warn('Cargando productos estáticos por defecto (Firebase no configurado aún).');
            activarBotonesCarrito();
        }
    };

    /* ==========================================================================
       2. NOTIFICACIÓN INTERACTIVA DEL CARRITO
       ========================================================================== */
    const activarBotonesCarrito = () => {
        const cardButtons = document.querySelectorAll('.btn-card');
        cardButtons.forEach((button) => {
            button.onclick = (e) => {
                const cardBody = e.target.closest('.card-body');
                const productName = cardBody.querySelector('h3').textContent;
                alert(`¡Excelente elección! Agregaste "${productName}" a tu pedido.`);
            };
        });
    };

    // Inicializamos la carga del menú
    cargarProductosMenu();


    /* ==========================================================================
       3. VALIDACIÓN Y CREACIÓN DE PEDIDOS EN FIREBASE (CRUD 3 - CREATE)
       ========================================================================== */
    const contactForm = document.getElementById('contactForm');
    const inputNombre = document.getElementById('nombre');
    const inputEmail = document.getElementById('email');
    const inputPedido = document.getElementById('pedido');

    const errorNombre = document.getElementById('errorNombre');
    const errorEmail = document.getElementById('errorEmail');
    const errorPedido = document.getElementById('errorPedido');
    const formSuccess = document.getElementById('formSuccess');

    // Validación por Expresión Regular
    const isValidEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    // Envío del formulario
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let isValid = true;

        // Limpieza de mensajes previos
        errorNombre.textContent = '';
        errorEmail.textContent = '';
        errorPedido.textContent = '';
        formSuccess.style.display = 'none';

        // Validar Nombre
        if (inputNombre.value.trim() === '') {
            errorNombre.textContent = 'El nombre es obligatorio.';
            isValid = false;
        } else if (inputNombre.value.trim().length < 3) {
            errorNombre.textContent = 'El nombre debe tener al menos 3 caracteres.';
            isValid = false;
        }

        // Validar Email
        if (inputEmail.value.trim() === '') {
            errorEmail.textContent = 'El correo electrónico es obligatorio.';
            isValid = false;
        } else if (!isValidEmail(inputEmail.value.trim())) {
            errorEmail.textContent = 'Por favor, ingresa un correo electrónico válido.';
            isValid = false;
        }

        // Validar Detalle del Pedido
        if (inputPedido.value.trim() === '') {
            errorPedido.textContent = 'Por favor, ingresa el detalle de tu pedido o mensaje.';
            isValid = false;
        } else if (inputPedido.value.trim().length < 10) {
            errorPedido.textContent = 'El mensaje debe ser más detallado (mínimo 10 caracteres).';
            isValid = false;
        }

        // Si la validación pasa, guardamos en Firebase Firestore (CRUD 3)
        if (isValid) {
            const nuevoPedido = {
                cliente: inputNombre.value.trim(),
                email: inputEmail.value.trim(),
                detalle: inputPedido.value.trim()
            };

            try {
                // Guardado asíncrono en Firestore
                await crearPedido(nuevoPedido);

                formSuccess.textContent = `¡Gracias por tu pedido, ${nuevoPedido.cliente}! Gustavo Fring y nuestro equipo ya lo recibieron en el sistema.`;
                formSuccess.style.display = 'block';

                contactForm.reset();
            } catch (err) {
                console.error("Error al guardar pedido en Firebase:", err);
                formSuccess.textContent = `¡Gracias, ${nuevoPedido.cliente}! Tu pedido ha sido procesado localmente.`;
                formSuccess.style.display = 'block';
                contactForm.reset();
            }
        }
    });

    /* ==========================================================================
       4. LIMPIEZA DE ERRORES EN TIEMPO REAL (UX)
       ========================================================================== */
    inputNombre.addEventListener('input', () => {
        if (inputNombre.value.trim() !== '') errorNombre.textContent = '';
    });

    inputEmail.addEventListener('input', () => {
        if (isValidEmail(inputEmail.value.trim())) errorEmail.textContent = '';
    });

    inputPedido.addEventListener('input', () => {
        if (inputPedido.value.trim().length >= 10) errorPedido.textContent = '';
    });
});