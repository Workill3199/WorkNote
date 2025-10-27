import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export type Workshop = {
  id?: string;
  title: string;
  description?: string;
  location?: string; // Aula/Lugar
  schedule?: string; // Horario
  ownerId?: string;
  createdAt?: any;
};

const col = () => collection(db!, 'workshops');

export async function createWorkshop(input: { title: string; description?: string; location?: string; schedule?: string }): Promise<string> {
  const ref = await addDoc(col(), {
    title: input.title,
    description: input.description || '',
    location: input.location || '',
    schedule: input.schedule || '',
    ownerId: auth?.currentUser?.uid || '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listWorkshops(): Promise<Workshop[]> {
  const q = query(col(), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function updateWorkshop(id: string, input: Partial<Workshop>) {
  await updateDoc(doc(db!, 'workshops', id), input as any);
}

export async function deleteWorkshop(id: string) {
  await deleteDoc(doc(db!, 'workshops', id));
}