import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { isUserAuthorizedForCourse } from './courses';

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
  // Adjuntos opcionales (PDF, DOCX, etc.)
  attachments?: { name: string; url: string; contentType?: string; size?: number }[];
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
  const uid = auth?.currentUser?.uid || '';
  const q = query(col(), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  return rows.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
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
  // Mostrar todas las actividades del curso si el usuario está autorizado (dueño o colaborador)
  const authorized = await isUserAuthorizedForCourse(courseId);
  const uid = auth?.currentUser?.uid || '';
  const visible = authorized ? items : items.filter(r => (r.ownerId ?? '') === uid);
  return visible.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

export async function listActivitiesByWorkshop(workshopId: string): Promise<Activity[]> {
  // Evitamos composite index: sin orderBy en la consulta y ordenamos en cliente.
  const q = query(col(), where('workshopId', '==', workshopId));
  const snap = await getDocs(q);
  // Filtrar por ownerId en cliente para evitar índices compuestos
  const uid = auth?.currentUser?.uid || '';
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(r => (r.ownerId ?? '') === uid);
  return items.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

export async function updateActivity(id: string, input: Partial<Activity>) {
  // Firestore no admite valores undefined en updateDoc. Limpiamos el payload.
  const cleaned: Record<string, any> = {};
  Object.entries(input || {}).forEach(([key, value]) => {
    if (value !== undefined) cleaned[key] = value;
  });
  await updateDoc(doc(db!, 'activities', id), cleaned as any);
}

export async function deleteActivity(id: string) {
  await deleteDoc(doc(db!, 'activities', id));
}