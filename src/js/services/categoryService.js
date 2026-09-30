import { db } from '../firebase/config.js';
import { 
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COLLECTION = 'categorias';

// 1. Crear
export const crearCategoria = async (categoria) => {
    return await addDoc(collection(db, COLLECTION), categoria);
};

// 2. Leer todas
export const obtenerCategorias = async () => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 3. Actualizar
export const actualizarCategoria = async (id, datos) => {
    const docRef = doc(db, COLLECTION, id);
    return await updateDoc(docRef, datos);
};

// 4. Eliminar
export const eliminarCategoria = async (id) => {
    const docRef = doc(db, COLLECTION, id);
    return await deleteDoc(docRef);
};