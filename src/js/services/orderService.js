import { db } from '../firebase/config.js';
import { 
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COLLECTION = 'pedidos';

// 1. Crear Pedido (Create)
export const crearPedido = async (pedido) => {
    return await addDoc(collection(db, COLLECTION), {
        ...pedido,
        fecha: new Date().toLocaleString(),
        estado: 'Pendiente'
    });
};

// 2. Leer Pedidos (Read)
export const obtenerPedidos = async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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