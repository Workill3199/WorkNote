import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export type Activity = {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO string
  category?: string; // Evaluación, Proyecto, Práctica
  courseId?: string;
  workshopId?: string;
  ownerId?: string;
  createdAt?: any;
};

const col = () => collection(db!, 'activities');

export async function createActivity(input: { title: string; description?: string; dueDate?: string; category?: string; courseId?: string; workshopId?: string }): Promise<string> {
  const ref = await addDoc(col(), {
    title: input.title,
    description: input.description || '',
    dueDate: input.dueDate || null,
    category: input.category || '',
    courseId: input.courseId || '',
    workshopId: input.workshopId || '',
    ownerId: auth?.currentUser?.uid || '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listActivities(): Promise<Activity[]> {
  const q = query(col(), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function listActivitiesByCourse(courseId: string): Promise<Activity[]> {
  const q = query(col(), where('courseId', '==', courseId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function listActivitiesByWorkshop(workshopId: string): Promise<Activity[]> {
  const q = query(col(), where('workshopId', '==', workshopId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function updateActivity(id: string, input: Partial<Activity>) {
  await updateDoc(doc(db!, 'activities', id), input as any);
}

export async function deleteActivity(id: string) {
  await deleteDoc(doc(db!, 'activities', id));
}