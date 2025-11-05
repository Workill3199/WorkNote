// Servicio de entregas (submissions): creación, actualización y listado por actividad.
// Restringe visibilidad según autorización del curso; alumnos ven solo sus propias entregas.
import { addDoc, collection, doc, updateDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { isUserAuthorizedForCourse } from './courses';

// Tipo de entrega
export type Submission = {
  id?: string;
  activityId: string;
  courseId?: string;
  title?: string;
  description?: string;
  ownerId?: string; // alumno que entrega
  createdAt?: any;
  attachments?: { name: string; url: string; contentType?: string; size?: number }[];
};

// Colección principal
const col = () => collection(db!, 'submissions');

// Crea una entrega de actividad
export async function createSubmission(input: { activityId: string; courseId?: string; title?: string; description?: string }): Promise<string> {
  const ref = await addDoc(col(), {
    activityId: input.activityId,
    courseId: input.courseId || '',
    title: input.title || '',
    description: input.description || '',
    ownerId: auth?.currentUser?.uid || '',
    createdAt: serverTimestamp(),
    attachments: [],
  });
  return ref.id;
}

// Actualiza una entrega por id
export async function updateSubmission(id: string, data: Partial<Submission>): Promise<void> {
  const ref = doc(db!, 'submissions', id);
  await updateDoc(ref, data as any);
}

// Lista entregas por actividad; si se provee courseId, verifica autorización
export async function listSubmissionsByActivity(activityId: string, courseId?: string): Promise<Submission[]> {
  const q = query(col(), where('activityId', '==', activityId));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Submission[];
  const uid = auth?.currentUser?.uid || '';
  let visible = rows;
  if (courseId) {
    try {
      const authorized = await isUserAuthorizedForCourse(courseId);
      if (!authorized) {
        visible = rows.filter(r => (r.ownerId ?? '') === uid);
      }
    } catch {
      // Si falla la verificación, mostramos solo las propias
      visible = rows.filter(r => (r.ownerId ?? '') === uid);
    }
  }
  // Orden descendente por fecha de creación
  return visible.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}