import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export type Activity = {
  id?: string;
  title: string;
  description?: string;
  dueDate?: string; // ISO string
  category?: string; // Evaluación, Proyecto, Práctica
  courseId?: string; // legacy single course
  courseIds?: string[]; // asignada a múltiples clases (cursos)
  workshopId?: string;
  priority?: 'alta' | 'media' | 'baja';
  completed?: boolean;
  ownerId?: string;
  createdAt?: any;
};

const col = () => collection(db!, 'activities');

export async function createActivity(input: { title: string; description?: string; dueDate?: string; category?: string; courseId?: string; courseIds?: string[]; workshopId?: string; priority?: 'alta' | 'media' | 'baja'; completed?: boolean }): Promise<string> {
  const ref = await addDoc(col(), {
    title: input.title,
    description: input.description || '',
    dueDate: input.dueDate || null,
    category: input.category || '',
    courseId: input.courseId || '',
    courseIds: Array.isArray(input.courseIds) ? input.courseIds : [],
    workshopId: input.workshopId || '',
    priority: input.priority || 'media',
    completed: !!input.completed,
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
  // Soporta documentos legacy con courseId y nuevos con courseIds (array)
  // Evitamos composite index quitando orderBy en las consultas con where y ordenamos en cliente.
  const legacyQ = query(col(), where('courseId', '==', courseId));
  const arrayQ = query(col(), where('courseIds', 'array-contains', courseId));
  const [legacySnap, arraySnap] = await Promise.all([getDocs(legacyQ), getDocs(arrayQ)]);
  const allDocs = [...legacySnap.docs, ...arraySnap.docs];
  const seen = new Set<string>();
  const items: Activity[] = [];
  for (const d of allDocs) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      items.push({ id: d.id, ...(d.data() as any) });
    }
  }
  return items.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

export async function listActivitiesByWorkshop(workshopId: string): Promise<Activity[]> {
  // Evitamos composite index: sin orderBy en la consulta y ordenamos en cliente.
  const q = query(col(), where('workshopId', '==', workshopId));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  return items.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

export async function updateActivity(id: string, input: Partial<Activity>) {
  await updateDoc(doc(db!, 'activities', id), input as any);
}

export async function deleteActivity(id: string) {
  await deleteDoc(doc(db!, 'activities', id));
}