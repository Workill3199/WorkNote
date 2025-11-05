// Servicio para manejar registros de asistencia en Firestore
// Provee funciones para crear, listar y obtener historial por curso
import { addDoc, collection, getDocs, query, serverTimestamp, where, orderBy } from 'firebase/firestore'; // Métodos Firestore
import { db, auth } from '../config/firebase'; // Instancias de Firestore y autenticación

// Estructura de un registro de asistencia almacenado en Firestore
export type AttendanceRecord = {
  id?: string; // ID de documento en Firestore
  courseId: string; // ID del curso
  date: string; // Fecha en formato YYYY-MM-DD
  presentStudents: string[]; // IDs de estudiantes presentes
  absentStudents: string[]; // IDs de estudiantes ausentes
  totalStudents: number; // Total de estudiantes en el curso
  presentCount: number; // Conteo de presentes (derivado)
  absentCount: number; // Conteo de ausentes (derivado)
  notes?: string; // Notas opcionales del registro
  ownerId?: string; // Usuario que creó el registro
  createdAt?: any; // Timestamp de creación (serverTimestamp)
};

// Devuelve la referencia a la colección "attendance" en Firestore
const col = () => collection(db!, 'attendance');

// Crea un registro de asistencia nuevo y devuelve su ID
export async function createAttendanceRecord(input: {
  courseId: string;
  presentStudents: string[];
  absentStudents: string[];
  totalStudents: number;
  notes?: string;
}): Promise<string> {
  const date = new Date(); // Fecha actual
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const ref = await addDoc(col(), {
    courseId: input.courseId,
    date: dateString,
    presentStudents: input.presentStudents,
    absentStudents: input.absentStudents,
    totalStudents: input.totalStudents,
    presentCount: input.presentStudents.length, // Calcula presentes
    absentCount: input.absentStudents.length, // Calcula ausentes
    notes: input.notes || '',
    ownerId: auth?.currentUser?.uid || '', // Usuario autenticado
    createdAt: serverTimestamp(), // Timestamp del servidor
  });
  
  return ref.id; // Devuelve el ID del documento creado
}

// Lista registros de asistencia por curso, ordenados por creación descendente
export async function listAttendanceRecords(courseId: string): Promise<AttendanceRecord[]> {
  const q = query(
    col(), 
    where('courseId', '==', courseId), // Filtra por ID de curso
    orderBy('createdAt', 'desc') // Ordena por creación (más recientes primero)
  );
  
  const snap = await getDocs(q); // Ejecuta consulta
  const records = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })); // Mapea documentos a objetos
  
  return records; // Devuelve arreglo de registros
}

// Obtiene historial de asistencia (alias de listAttendanceRecords)
export async function getAttendanceHistory(courseId: string): Promise<AttendanceRecord[]> {
  return await listAttendanceRecords(courseId);
}