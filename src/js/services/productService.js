import { db } from '../firebase/config.js';
import { 
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COLLECTION = 'productos';

// 1. Crear
export const crearProducto = async (producto) => {
    return await addDoc(collection(db, COLLECTION), producto);
};

// 2. Leer todos
export const obtenerProductos = async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 3. Actualizar
export const actualizarProducto = async (id, datos) => {
    const docRef = doc(db, COLLECTION, id);
    return await updateDoc(docRef, datos);
};

// 4. Eliminar
export const eliminarProducto = async (id) => {
    const docRef = doc(db, COLLECTION, id);
    return await deleteDoc(docRef);
};