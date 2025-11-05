// Servicio de estudiantes: creación y listados por curso/taller.
import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { isUserAuthorizedForCourse } from './courses';

// Tipo Student en Firestore
export type Student = {
  id?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  classLabel?: string; // 'A' | 'B' | 'C' | 'D'
  courseId?: string;
  workshopId?: string;
  ownerId?: string;
  createdAt?: any;
};

// Colección principal
const col = () => collection(db!, 'students');

// Crea estudiante asociado a curso/taller y lo asigna al usuario actual
export async function createStudent(input: { firstName: string; lastName?: string; email?: string; classLabel?: string; courseId?: string; workshopId?: string }): Promise<string> {
  const ref = await addDoc(col(), {
    firstName: input.firstName,
    lastName: input.lastName || '',
    email: input.email || '',
    classLabel: (input.classLabel || 'A').toUpperCase(),
    courseId: input.courseId || '',
    workshopId: input.workshopId || '',
    ownerId: auth?.currentUser?.uid || '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Lista estudiantes creados por el usuario actual
export async function listStudents(): Promise<Student[]> {
  const uid = auth?.currentUser?.uid || '';
  const q = query(col(), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  return rows.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

// Lista estudiantes por curso; si el usuario no está autorizado, filtra por ownerId
export async function listStudentsByCourse(courseId: string): Promise<Student[]> {
  const q = query(col(), where('courseId', '==', courseId));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  // Si el usuario está autorizado en el curso, mostramos todos los estudiantes del curso, sin filtrar por owner.
  const authorized = await isUserAuthorizedForCourse(courseId);
  const uid = auth?.currentUser?.uid || '';
  const visible = authorized ? rows : rows.filter(r => (r.ownerId ?? '') === uid);
  return visible.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

// Lista estudiantes por taller (filtra ownerId en cliente)
export async function listStudentsByWorkshop(workshopId: string): Promise<Student[]> {
  const q = query(col(), where('workshopId', '==', workshopId));
  const snap = await getDocs(q);
  // Filtramos por ownerId en cliente para evitar índices compuestos
  const uid = auth?.currentUser?.uid || '';
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })).filter(r => (r.ownerId ?? '') === uid);
  return rows.sort((a: any, b: any) => (a.createdAt?.toMillis?.() ?? 0) < (b.createdAt?.toMillis?.() ?? 0) ? 1 : -1);
}

// Actualiza estudiante, omitiendo campos undefined
export async function updateStudent(id: string, input: Partial<Student>) {
  const payload = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  );
  await updateDoc(doc(db!, 'students', id), payload as any);
}

// Elimina estudiante por id
export async function deleteStudent(id: string) {
  await deleteDoc(doc(db!, 'students', id));
}