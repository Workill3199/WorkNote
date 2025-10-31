// Servicio de usuarios: registro en Auth + documento de perfil, obtener rol y listar por UID.
import { addDoc, collection, serverTimestamp, updateDoc, doc, deleteDoc, where, getDoc, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth as configAuth } from '../config/firebase';

// Tipo de usuario de aplicación (perfil almacenado en Firestore)
export type User = {
  fullName: string
  email: string
  password: string
  password_confirm: string 
  isTeacher: boolean
  uid?: string
};


// Colección de perfiles
const col = () => collection(db!, 'users');

// Crea usuario: alta en Firebase Auth y documento de perfil
export async function createUser(user: User): Promise<string> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      configAuth!, 
      user.email.trim(), 
      user.password
    );

    const uid = userCredential.user.uid;

    const ref = await addDoc(col(), {
      uid: uid,
      fullName: user.fullName,
      email: user.email.trim(),
      role: user.isTeacher ? "profesor" : "alumno",
      isTeacher: user.isTeacher,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Usuario creado con ID de documento:', ref.id);
    return ref.id;

  } catch (error) {
    console.error('Error creando usuario:', error);
    throw error;
  }
}
// Obtiene rol del usuario autenticado desde su documento de perfil
export async function getUserRole() {
  try {
    const user = configAuth!.currentUser;
    
    if (!user) return null;

    const userQuery = query(
      col(), 
      where('uid', '==', user.uid)
    );
    
    const querySnapshot = await getDocs(userQuery);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data().role;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error obteniendo rol:', error);
    return null;
  }
}

// Lista perfiles para varios UIDs (evita duplicados)
export async function listUsersByUids(uids: string[]): Promise<(User & { id?: string; uid?: string })[]> {
  try {
    const unique = Array.from(new Set((uids || []).filter(Boolean)));
    if (!unique.length) return [];
    const results: any[] = [];
    for (const u of unique) {
      const q = query(col(), where('uid', '==', u));
      const snap = await getDocs(q);
      results.push(...snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }
    return results;
  } catch (error) {
    console.error('Error listando usuarios por UID:', error);
    return [];
  }
}