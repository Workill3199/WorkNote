import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
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
  const uid = auth?.currentUser?.uid || '';
  const q = query(col(), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  return rows.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

export async function updateWorkshop(id: string, input: Partial<Workshop>) {
  await updateDoc(doc(db!, 'workshops', id), input as any);
}

export async function deleteWorkshop(id: string) {
  await deleteDoc(doc(db!, 'workshops', id));
}