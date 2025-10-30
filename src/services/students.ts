import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

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

const col = () => collection(db!, 'students');

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

export async function listStudents(): Promise<Student[]> {
  const q = query(col(), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function listStudentsByCourse(courseId: string): Promise<Student[]> {
  const q = query(col(), where('courseId', '==', courseId));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  return rows.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function listStudentsByWorkshop(workshopId: string): Promise<Student[]> {
  const q = query(col(), where('workshopId', '==', workshopId));
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  return rows.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function updateStudent(id: string, input: Partial<Student>) {
  const payload = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined)
  );
  await updateDoc(doc(db!, 'students', id), payload as any);
}

export async function deleteStudent(id: string) {
  await deleteDoc(doc(db!, 'students', id));
}