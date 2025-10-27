import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export type Course = {
  id?: string;
  title: string;
  description?: string;
  classroom?: string; // Aula
  schedule?: string;  // Horario
  semester?: string;  // Semestre
  ownerId?: string;
  createdAt?: any;
};

const col = () => collection(db!, 'courses');

export async function createCourse(input: { title: string; description?: string; classroom?: string; schedule?: string; semester?: string }): Promise<string> {
  const ref = await addDoc(col(), {
    title: input.title,
    description: input.description || '',
    classroom: input.classroom || '',
    schedule: input.schedule || '',
    semester: input.semester || '',
    ownerId: auth?.currentUser?.uid || '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listCourses(): Promise<Course[]> {
  const q = query(col(), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function updateCourse(id: string, input: Partial<Course>) {
  await updateDoc(doc(db!, 'courses', id), input as any);
}

export async function deleteCourse(id: string) {
  await deleteDoc(doc(db!, 'courses', id));
}