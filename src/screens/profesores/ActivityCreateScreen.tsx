// Pantalla para crear/editar actividades.
// Permite cargar título, descripción, categoría, fecha de vencimiento, prioridad, asignación a clases y adjuntar archivos (web).
import React, { useEffect, useState } from "react"; // React y hooks para estado/efectos
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from "react-native"; // Componentes de UI RN
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Iconos
import { storage } from "../../config/firebase"; // Referencia de Firebase Storage inicializada en config
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Funciones de Storage: referencia, subir, obtener URL
import { useTheme } from "@react-navigation/native"; // Hook para colores del tema actual
import { NativeStackScreenProps } from "@react-navigation/native-stack"; // Tipado de navegación
import {
  createActivity,
  updateActivity,
  deleteActivity,
  Activity,
} from "../../services/activities"; // Servicios de actividades
import { listCourses, Course } from "../../services/courses"; // Servicios de cursos (para asignar actividad a cursos)
import { darkColors } from "../../theme/colors"; // Paleta fija de colores oscuros
import { fonts } from "../../theme/typography"; // Tipografías del proyecto
import { SafeAreaView } from "react-native-safe-area-context"; // Asegura el área segura en iOS/Android
import { FileUpload, SelectedFile } from "../../components/files";
import { uploadFilesToServer } from "../../services/file";
// Nota: Adjuntos funcionales en web; en móvil se muestra aviso

// Props del screen según navegación (stack nativo)
type Props = NativeStackScreenProps<any>;

export default function ActivityCreateScreen({ navigation, route }: Props) {
  const { colors } = useTheme(); // Colores del tema
  const palette = darkColors; // Alias de paleta oscura
  const editItem = (route as any)?.params?.editItem as Activity | undefined; // Item a editar si viene en route
  // Estados controlados para cada campo del formulario
  const [title, setTitle] = useState(editItem?.title || ""); // Título de la actividad
  const [description, setDescription] = useState(editItem?.description || ""); // Descripción
  const [dueDate, setDueDate] = useState(
    editItem?.dueDate
      ? new Date(editItem.dueDate).toISOString().slice(0, 10)
      : ""
  ); // Fecha (YYYY-MM-DD)
  const [dateFocused, setDateFocused] = useState(false); // UI: foco del input date en web
  const [category, setCategory] = useState(editItem?.category || ""); // Categoría
  const [courseId, setCourseId] = useState(editItem?.courseId || ""); // Curso simple (cuando no se usa múltiple)
  const [courseIds, setCourseIds] = useState<string[]>(
    Array.isArray(editItem?.courseIds) ? (editItem!.courseIds as string[]) : []
  ); // Cursos múltiples
  const [workshopId, setWorkshopId] = useState(editItem?.workshopId || ""); // Taller opcional
  const [priority, setPriority] = useState<"alta" | "media" | "baja">(
    editItem?.priority || "media"
  ); // Prioridad
  const [loading, setLoading] = useState(false); // Indicador de operación en curso
  const [error, setError] = useState<string | null>(null); // Error de operación
  const [courses, setCourses] = useState<Course[]>([]); // Lista de cursos para seleccionar
  const [pendingFiles, setPendingFiles] = useState<any[]>([]); // Archivos pendientes por subir (web: File[])
  // Nota: en móvil no se adjunta; se muestra aviso

  const [files, setFiles] = useState<SelectedFile[]>([]);

  const handleFilesSelected = (newFiles: SelectedFile[]) => {
    setFiles(newFiles);
  };

  useEffect(() => {
    // Al montar, carga lista de cursos para permitir asignación
    listCourses().then(setCourses).catch(() => setCourses([]));
  }, []);

  // Sube archivos adjuntos a Firebase Storage y devuelve metadatos con URL
  const uploadAttachments = async () => {
    if (files.length === 0) {
      Alert.alert("Atención", "No hay archivos seleccionados");
      return;
    }

    try {
      const responses = await uploadFilesToServer(files);

      console.log("URLs recibidas:", responses);
      Alert.alert("Éxito", "Archivos subidos correctamente");
      return responses;
    } catch (error) {
      Alert.alert("Error", "No se pudieron subir los archivos al servidor");
    }
  };

  // Guarda cambios (crear o actualizar actividad) y opcionalmente sube adjuntos
  const onSave = async () => {
    setError(null); // Limpia errores previos
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    } // Valida título
    setLoading(true); // Muestra spinner
    try {
      const due = dueDate ? new Date(dueDate).toISOString() : undefined; // Normaliza fecha a ISO
      const normalizedCourseIds = Array.from(
        new Set(courseIds.filter(Boolean))
      ); // Deduplica cursos múltiples
      const singleCourseId = (courseId || normalizedCourseIds[0] || "").trim(); // Selecciona curso simple si aplica
      if (editItem?.id) {
        // Actualización de actividad existente
        await updateActivity(editItem.id, {
          title: title.trim(),
          description: description.trim(),
          dueDate: due,
          category: category.trim(),
          courseId: singleCourseId || undefined,
          courseIds: normalizedCourseIds,
          workshopId: workshopId.trim() || undefined,
          priority,
        });
        // Subir adjuntos nuevos si se seleccionaron
        if (files.length) {
          const newAtts = await uploadAttachments();
          const prev = Array.isArray(editItem.attachments)
            ? editItem.attachments
            : []; // Adjuntos previos
          const merged = [...prev, ...newAtts!]; // Combina previos con nuevos
          await updateActivity(editItem.id, { attachments: merged as any });
        }
      } else {
        // Creación de nueva actividad
        const newId = await createActivity({
          title: title.trim(),
          description: description.trim(),
          dueDate: due,
          category: category.trim(),
          courseId: singleCourseId || undefined,
          courseIds: normalizedCourseIds,
          workshopId: workshopId.trim() || undefined,
          priority,
        });
        // Subir adjuntos si hay seleccionados
        if (files.length) {
          const uploaded = await uploadAttachments();
          if (uploaded!.length > 0) {
            await updateActivity(newId, { attachments: uploaded as any });
          }
        }
      }
      navigation.goBack(); // Regresa a la pantalla anterior
    } catch (e: any) {
      // Muestra mensaje de error genérico según operación
      setError(
        e?.message ??
          (editItem?.id
            ? "Error al actualizar actividad"
            : "Error al crear actividad")
      );
    } finally {
      setLoading(false); // Oculta spinner
    }
  };

  // Elimina la actividad actual (si existe) con confirmación según plataforma
  const onDelete = async () => {
    if (!editItem?.id) return; // No hay nada que eliminar
    const performDelete = async () => {
      setLoading(true);
      setError(null);
      try {
        await deleteActivity(editItem.id!); // Llama servicio de borrado
        navigation.goBack(); // Vuelve atrás
      } catch (e: any) {
        setError(e?.message ?? "Error al eliminar actividad"); // Muestra error
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === "web") {
      // Confirmación simple en web
      const ok = (global as any).confirm
        ? (global as any).confirm(
            "¿Deseas eliminar esta actividad? Esta acción no se puede deshacer."
          )
        : true;
      if (ok) performDelete();
    } else {
      Alert.alert(
        "Eliminar actividad",
        "¿Deseas eliminar esta actividad? Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: performDelete },
        ]
      );
    }
  };

  return (
    // Contenedor principal con área segura
    <SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Título de la pantalla según modo */}
          <Text style={[styles.title, { color: colors.text }]}>
            {editItem?.id ? "Editar Actividad" : "Nueva Actividad"}
          </Text>
          {/* Mensaje de error si existe */}
          {!!error && <Text style={styles.error}>{error}</Text>}
          {/* Tarjeta del formulario */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.label, { color: colors.text }]}>Título</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Ingresa el título de la actividad"
              placeholderTextColor={colors.text}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Descripción
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                  height: 100,
                },
              ]}
              placeholder="Describe la actividad"
              placeholderTextColor={colors.text}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Categoría
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Proyecto, Tarea, Práctica, etc."
              placeholderTextColor={colors.text}
              value={category}
              onChangeText={setCategory}
            />

            <FileUpload
              onFilesSelected={handleFilesSelected}
              multiple={false}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              Fecha de vencimiento
            </Text>
            {Platform.OS === "web" ? (
              <View
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: dateFocused
                      ? (colors as any).primary
                      : colors.border,
                  },
                ]}
              >
                {React.createElement("style", {
                  dangerouslySetInnerHTML: {
                    __html: `
                  .due-date-input::placeholder { color: ${String(
                    (colors as any).text
                  )}; opacity: 0.6; }
                  .due-date-input { color-scheme: ${"dark"}; }
                `,
                  },
                })}
                {React.createElement("input", {
                  type: "date",
                  className: "due-date-input",
                  value: dueDate,
                  onChange: (e: any) => setDueDate(e?.target?.value ?? ""),
                  onFocus: () => setDateFocused(true),
                  onBlur: () => setDateFocused(false),
                  style: {
                    width: "100%",
                    background: "transparent",
                    color: (colors as any).text,
                    border: "none",
                    outline: "none",
                    fontSize: 16,
                    padding: 0,
                    height: 24,
                    accentColor: (colors as any).primary,
                    caretColor: (colors as any).primary,
                  },
                })}
              </View>
            ) : (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text}
                value={dueDate}
                onChangeText={setDueDate}
              />
            )}

            <Text style={[styles.label, { color: colors.text }]}>
              Prioridad
            </Text>
            <View style={styles.filtersRow}>
              {(
                [
                  { key: "alta", label: "Alta" },
                  { key: "media", label: "Media" },
                  { key: "baja", label: "Baja" },
                ] as const
              ).map((p) => {
                const active = priority === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setPriority(p.key)}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>
              Asignar a clases
            </Text>
            <View style={styles.filtersRow}>
              {courses.map((c) => {
                const active = courseIds.includes(c.id!);
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      setCourseIds((prev) =>
                        prev.includes(c.id!)
                          ? prev.filter((id) => id !== c.id)
                          : [...prev, c.id!]
                      );
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.hint, { color: colors.text }]}>
              Puedes seleccionar múltiples clases. Se guardarán asignadas a esta
              actividad.
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>
              Taller (opcional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="ID de Taller"
              placeholderTextColor={colors.text}
              value={workshopId}
              onChangeText={setWorkshopId}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={onSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {editItem?.id ? "Actualizar" : "Guardar"}
                </Text>
              )}
            </TouchableOpacity>
            {editItem?.id && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: darkColors.error }]}
                onPress={onDelete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos del formulario y chips
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 }, // Contenedor principal
  title: { fontSize: 18, fontFamily: fonts.bold, marginBottom: 12 }, // Título pantalla
  formCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  }, // Tarjeta del formulario
  label: { fontSize: 12, fontWeight: "700", marginBottom: 6 }, // Etiquetas de campos
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  }, // Inputs
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  }, // Botones
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" }, // Texto de botón
  error: { color: darkColors.error, marginBottom: 12, textAlign: "center" }, // Mensaje de error
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8 as any,
    marginBottom: 8,
  }, // Fila de chips
  chip: {
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor:
      Platform.OS === "web" ? "rgba(20,25,35,0.5)" : darkColors.card,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        } as any)
      : {}),
  },
  chipActive: {
    borderColor: "rgba(110,120,255,0.5)",
    backgroundColor: "rgba(110,120,255,0.10)",
  }, // Chip activo
  chipText: { color: darkColors.mutedText, fontSize: 12 }, // Texto de chip
  chipTextActive: { color: darkColors.primary }, // Texto de chip activo
  hint: { fontSize: 11, color: darkColors.mutedText, marginBottom: 12 }, // Texto de ayuda
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  }, // Contenido del ScrollView
});
