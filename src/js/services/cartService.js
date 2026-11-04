// src/js/services/cartService.js

const CART_KEY = 'pollos_hermanos_cart';

// Obtener productos del carrito
export const obtenerCarrito = () => {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
};

// Agregar un producto al carrito (cantidad opcional, por defecto 1)
export const agregarAlCarrito = (producto, cantidad = 1) => {
    const cart = obtenerCarrito();
    const existe = cart.find(item => item.id === producto.id);

    if (existe) {
        existe.cantidad += cantidad;
    } else {
        cart.push({ ...producto, cantidad });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    actualizarBadgeCarrito();
};

// Quitar un producto completo del carrito
export const eliminarDelCarrito = (id) => {
    const cart = obtenerCarrito().filter(item => item.id !== id);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    actualizarBadgeCarrito();
    return cart;
};

// Cambiar cantidad de un producto
export const cambiarCantidadProducto = (id, cambio) => {
    let cart = obtenerCarrito();
    const producto = cart.find(item => item.id === id);

    if (producto) {
        producto.cantidad += cambio;
        if (producto.cantidad <= 0) {
            cart = cart.filter(item => item.id !== id);
        }
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    actualizarBadgeCarrito();
    return cart;
};

// Vaciar carrito
export const vaciarCarrito = () => {
    localStorage.removeItem(CART_KEY);
    actualizarBadgeCarrito();
};

// Calcular total acumulado
export const obtenerTotalCarrito = () => {
    const cart = obtenerCarrito();
    return cart.reduce((total, p) => total + (p.precio * p.cantidad), 0);
};

// Actualizar el contador en la Navbar
export const actualizarBadgeCarrito = () => {
    const cart = obtenerCarrito();
    const totalItems = cart.reduce((count, item) => count + item.cantidad, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
};