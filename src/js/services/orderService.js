import { db } from '../firebase/config.js';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    query, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COLLECTION = 'pedidos';

// 1. Crear Pedido (Create)
// - "fecha": texto legible para mostrar
// - "creadoEn": fecha real del servidor, permite ordenar y filtrar de forma confiable
export const crearPedido = async (pedido) => {
    return await addDoc(collection(db, COLLECTION), {
        ...pedido,
        fecha: new Date().toLocaleString(),
        creadoEn: serverTimestamp(),
        estado: 'Pendiente'
    });
};

// 2. Leer Pedidos (Read)
// Optimizada: el servidor ordena del más nuevo al más antiguo y devuelve
// como máximo "maximo" documentos, en lugar de traer toda la colección.
export const obtenerPedidos = async (maximo = 50) => {
    const consulta = query(
        collection(db, COLLECTION),
        orderBy('creadoEn', 'desc'),
        limit(maximo)
    );
    const snapshot = await getDocs(consulta);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// 3. Actualizar Estado de Pedido (Update)
export const actualizarEstadoPedido = async (id, nuevoEstado) => {
    const docRef = doc(db, COLLECTION, id);
    return await updateDoc(docRef, { estado: nuevoEstado });
};

// 4. Cancelar / Eliminar Pedido (Delete)
export const eliminarPedido = async (id) => {
    const docRef = doc(db, COLLECTION, id);
    return await deleteDoc(docRef);
};