// Servicio de comentarios de actividades: creación, listado y suscripción realtime.
import { addDoc, collection, getDocs, query, where, serverTimestamp, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { getCourse } from './courses';

export type Comment = {
  id?: string;
  activityId: string;
  text: string;
  ownerId?: string; // autor del comentario
  ownerName?: string;
  courseId?: string;
  role?: 'alumno' | 'profesor';
  createdAt?: any;
};

const col = () => collection(db!, 'comments');

export async function createComment(activityId: string, text: string, courseId?: string): Promise<string> {
  const uid = auth?.currentUser?.uid || '';
  const displayName = (auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || 'Usuario').trim();
  let role: 'alumno' | 'profesor' = 'alumno';
  if (courseId) {
    try {
      const course = await getCourse(courseId);
      if (course?.ownerId === uid) role = 'profesor';
    } catch {}
  }
  const ref = await addDoc(col(), {
    activityId,
    courseId: courseId || '',
    text: text.trim(),
    ownerId: uid,
    ownerName: displayName,
    role,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listCommentsByActivity(activityId: string): Promise<Comment[]> {
  const q = query(col(), where('activityId', '==', activityId));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Comment[];
  // Orden descendente por fecha
  return rows.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

// Suscripción realtime (sin orderBy para evitar índices compuestos); se ordena en cliente.
export function subscribeCommentsByActivity(activityId: string, onUpdate: (rows: Comment[]) => void): () => void {
  const q = query(col(), where('activityId', '==', activityId));
  const unsub = onSnapshot(q, (snap) => {
    const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Comment[];
    const sorted = rows.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
    try { onUpdate(sorted); } catch {}
  }, (err) => {
    console.warn('subscribeCommentsByActivity error:', err?.message || err);
  });
  return unsub;
}

export async function deleteComment(id: string): Promise<void> {
  await deleteDoc(doc(db!, 'comments', id));
}