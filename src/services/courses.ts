import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, doc, deleteDoc, where, getDoc, arrayUnion, runTransaction, setDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export type Course = {
  id?: string;
  title: string;
  description?: string;
  classroom?: string; // Aula
  schedule?: string;  // Horario
  semester?: string;  // Semestre
  ownerId?: string;
  shareCode?: string; // Código corto para compartir
  collaboratorIds?: string[]; // Otros usuarios con acceso
  createdAt?: any;
};

const col = () => collection(db!, 'courses');
const codesCol = () => collection(db!, 'courseCodes');
const studentsCol = () => collection(db!, 'students');

function randomCode(len = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

// Reserva un código único utilizando transacción en Firestore para evitar colisiones concurrentes.
async function reserveUniqueShareCodeForCourse(courseRefId: string): Promise<string> {
  const upper = (s: string) => s.trim().toUpperCase();
  return await runTransaction(db!, async (tx) => {
    // intentos acotados
    for (let i = 0; i < 6; i++) {
      const candidate = upper(randomCode(i < 5 ? 6 : 8));
      const codeRef = doc(db!, 'courseCodes', candidate);
      const existing = await tx.get(codeRef);
      if (!existing.exists()) {
        tx.set(codeRef, { courseId: courseRefId, createdAt: serverTimestamp() });
        return candidate;
      }
    }
    throw new Error('No se pudo generar un código único. Intenta nuevamente.');
  });
}

export async function createCourse(input: { title: string; description?: string; classroom?: string; schedule?: string; semester?: string }): Promise<string> {
  const ownerId = auth?.currentUser?.uid || '';
  // Creamos referencias y escribimos atomícamente curso + código en transacción
  const courseRef = doc(col());
  const id = courseRef.id;
  const shareCode = await reserveUniqueShareCodeForCourse(id);
  await runTransaction(db!, async (tx) => {
    tx.set(courseRef, {
      title: input.title,
      description: input.description || '',
      classroom: input.classroom || '',
      schedule: input.schedule || '',
      semester: input.semester || '',
      ownerId,
      shareCode,
      collaboratorIds: [],
      createdAt: serverTimestamp(),
    });
    // La reserva del código ya se realizó vinculando courseId => code
  });
  return id;
}

export async function listCourses(): Promise<Course[]> {
  const uid = auth?.currentUser?.uid || '';
  const ownedQ = query(col(), where('ownerId', '==', uid));
  const collabQ = query(col(), where('collaboratorIds', 'array-contains', uid));
  const [ownedSnap, collabSnap] = await Promise.all([getDocs(ownedQ), getDocs(collabQ)]);
  const dedup = new Map<string, any>();
  for (const d of [...ownedSnap.docs, ...collabSnap.docs]) {
    dedup.set(d.id, { id: d.id, ...(d.data() as any) });
  }
  const rows = Array.from(dedup.values());
  return rows.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

export async function updateCourse(id: string, input: Partial<Course>) {
  await updateDoc(doc(db!, 'courses', id), input as any);
}

export async function deleteCourse(id: string) {
  await deleteDoc(doc(db!, 'courses', id));
}

export async function getCourse(id: string): Promise<Course | null> {
  const dref = doc(db!, 'courses', id);
  const dsnap = await getDoc(dref);
  return dsnap.exists() ? ({ id: dsnap.id, ...(dsnap.data() as any) } as Course) : null;
}

export async function getCourseByShareCode(code: string): Promise<Course | null> {
  const ref = doc(db!, 'courseCodes', code.trim().toUpperCase());
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data() as any;
    if (!data?.courseId) return null;
    return await getCourse(data.courseId);
  }
  // Compatibilidad: si el mapeo no existe (cursos antiguos), busca por campo shareCode y crea el mapeo.
  const fallback = await getDocs(query(col(), where('shareCode', '==', code.trim().toUpperCase())));
  if (fallback.empty) return null;
  const d = fallback.docs[0];
  const course = { id: d.id, ...(d.data() as any) } as Course;
  try {
    await setDoc(ref, { courseId: course.id, createdAt: serverTimestamp() });
  } catch {}
  return course;
}

// Crea (si falta) un registro de estudiante para el usuario actual en el curso indicado.
async function ensureJoinedUserStudentForCourse(courseId: string): Promise<void> {
  const uid = auth?.currentUser?.uid || '';
  if (!uid) return;
  // Buscar estudiantes del curso y filtrar por ownerId en cliente para evitar índice compuesto
  const snap = await getDocs(query(studentsCol(), where('courseId', '==', courseId)));
  const existing = snap.docs
    .map(d => ({ id: d.id, ...(d.data() as any) }))
    .find(r => (r.ownerId ?? '') === uid);
  if (existing) return;
  const email = auth?.currentUser?.email || '';
  const displayName = auth?.currentUser?.displayName || '';
  const firstName = (displayName || (email ? email.split('@')[0] : 'Alumno')).trim();
  try {
    await addDoc(studentsCol(), {
      firstName,
      lastName: '',
      email,
      classLabel: 'A',
      courseId,
      workshopId: '',
      ownerId: uid,
      createdAt: serverTimestamp(),
    } as any);
  } catch (e) {
    // Evitar que un fallo al crear estudiante bloquee la unión a curso
    console.warn('No se pudo crear estudiante para usuario unido:', (e as any)?.message || e);
  }
}

export async function joinCourseByShareCode(code: string): Promise<Course | null> {
  const course = await getCourseByShareCode(code);
  if (!course?.id) return null;
  const uid = auth?.currentUser?.uid || '';
  await updateDoc(doc(db!, 'courses', course.id), { collaboratorIds: arrayUnion(uid) } as any);
  await ensureJoinedUserStudentForCourse(course.id);
  return { ...course, collaboratorIds: [...(course.collaboratorIds || []), uid] };
}

export async function joinCourseById(courseId: string): Promise<Course | null> {
  const course = await getCourse(courseId);
  if (!course?.id) return null;
  const uid = auth?.currentUser?.uid || '';
  await updateDoc(doc(db!, 'courses', course.id), { collaboratorIds: arrayUnion(uid) } as any);
  await ensureJoinedUserStudentForCourse(course.id);
  return { ...course, collaboratorIds: [...(course.collaboratorIds || []), uid] };
}

export async function isUserAuthorizedForCourse(courseId: string): Promise<boolean> {
  const uid = auth?.currentUser?.uid || '';
  const course = await getCourse(courseId);
  if (!course) return false;
  return (course.ownerId === uid) || (course.collaboratorIds || []).includes(uid);
}

// Garantiza que el curso tenga un shareCode persistido; si falta, lo genera y lo actualiza.
export async function ensureCourseShareCode(courseId: string): Promise<string> {
  const course = await getCourse(courseId);
  if (!course?.id) throw new Error('Curso no encontrado');
  if (course.shareCode) return course.shareCode;
  const code = await reserveUniqueShareCodeForCourse(courseId);
  await updateDoc(doc(db!, 'courses', courseId), { shareCode: code } as any);
  return code;
}