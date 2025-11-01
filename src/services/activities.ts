// Servicio de actividades: CRUD y listados por curso/taller.
// Diseñado para evitar índices compuestos cuando sea posible y ordenar en cliente.
import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { isUserAuthorizedForCourse } from './courses';

// Tipo de actividad en Firestore
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

// Colecciones relacionadas
const col = () => collection(db!, 'activities');
const studentsCol = () => collection(db!, 'students');

// Crea una actividad con metadatos y adjuntos opcionales
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

// Lista actividades del usuario actual (ownerId)
export async function listActivities(): Promise<Activity[]> {
  const uid = auth?.currentUser?.uid || '';
  const q = query(col(), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  return rows.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

// Lista actividades asignadas a un curso (soporta legacy courseId y courseIds[])
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

  let visible: Activity[] = items;
  if (!authorized) {
    // Si no está en collaboratorIds, verificar si es alumno inscrito en el curso
    try {
      const snap = await getDocs(query(studentsCol(), where('courseId', '==', courseId)));
      const isEnrolled = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .some(r => (r.ownerId ?? '') === uid);
      // Si está inscrito como alumno, permitir ver todas las actividades del curso
      if (!isEnrolled) {
        visible = items.filter(r => (r.ownerId ?? '') === uid);
      }
    } catch {
      // En caso de error al verificar inscripción, no bloquear: mostrar actividades del curso
      visible = items;
    }
  }
  return visible.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

// Lista actividades por taller (filtradas por ownerId en cliente)
export async function listActivitiesByWorkshop(workshopId: string): Promise<Activity[]> {
  // Evitamos composite index: sin orderBy en la consulta y ordenamos en cliente.
  const q = query(col(), where('workshopId', '==', workshopId));
  const snap = await getDocs(q);
  // Filtrar por ownerId en cliente para evitar índices compuestos
  const uid = auth?.currentUser?.uid || '';
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(r => (r.ownerId ?? '') === uid);
  return items.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

// Actualiza campos válidos (sin undefined) de una actividad
export async function updateActivity(id: string, input: Partial<Activity>) {
  // Firestore no admite valores undefined en updateDoc. Limpiamos el payload.
  const cleaned: Record<string, any> = {};
  Object.entries(input || {}).forEach(([key, value]) => {
    if (value !== undefined) cleaned[key] = value;
  });
  await updateDoc(doc(db!, 'activities', id), cleaned as any);
}

// Elimina una actividad por id
export async function deleteActivity(id: string) {
  await deleteDoc(doc(db!, 'activities', id));
}