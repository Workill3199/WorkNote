import { addDoc, collection, serverTimestamp, updateDoc, doc, deleteDoc, where, getDoc, query, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth as configAuth } from '../config/firebase';

export type User = {
  fullName: string
  email: string
  password: string
  password_confirm: string 
  isTeacher: boolean
  uid?: string
};


const col = () => collection(db!, 'users');

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