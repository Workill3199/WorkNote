import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Linking,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { darkColors } from "../../theme/colors";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  listActivities,
  Activity,
  deleteActivity,
  listActivitiesByCourse,
  listActivitiesByWorkshop,
  updateActivity,
} from "../../services/activities";
import ManagementCard from "../../components/ManagementCard";
import NeonButton from "../../components/NeonButton";
import { listCourses, Course } from "../../services/courses";
import { auth } from "../../config/firebase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../../config/firebase";
import { File, Directory } from "expo-file-system";

type Props = NativeStackScreenProps<any>;

export default function ActivitiesListScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "Todas" | "Pendientes" | "Completadas" | "Vencidas"
  >("Todas");
  const courseTitleById = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id!, c.title])),
    [courses]
  );
  // Filtro manual por clase cuando vienes desde la pestaña Actividades
  const [courseFilterId, setCourseFilterId] = useState<string | undefined>(
    (route as any)?.params?.filterCourseId
  );
  // Controla el despliegue del filtrador adicional de clases
  const [showClassFilter, setShowClassFilter] = useState(false);
  // Los alumnos no generan códigos; solo el profesor puede hacerlo.

  // Tokens portados desde "actividades" basados en el tema oscuro
  const T = {
    bg: darkColors.background,
    card: darkColors.card,
    text: darkColors.text,
    textMuted: darkColors.mutedText,
    border: darkColors.border,
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    accent: darkColors.accent,
    prioHigh: darkColors.error,
    prioMedium: darkColors.warning,
    prioLow: darkColors.success,
  } as const;
  const HEX = T;

  const handleDownload = async (url: string, filename: string) => {
    try {
      // Crear directorio temporal
      const downloadsDir =
        await Directory.documentDirectory.createDirectoryAsync("downloads", {
          intermediates: true,
        });
      const localUri = `${downloadsDir.path}/${filename}`;

      // Descargar usando la nueva API
      const file = new File({ uri: localUri });
      await file.downloadAsync(url);

      Alert.alert("Descarga completada", `Archivo guardado en: ${localUri}`);
      return localUri;
    } catch (err) {
      console.error("Error al descargar archivo:", err);
      Alert.alert("Error", "No se pudo descargar el archivo.");
    }
  };

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const filterCourseId = (route as any)?.params?.filterCourseId as
        | string
        | undefined;
      const filterWorkshopId = (route as any)?.params?.filterWorkshopId as
        | string
        | undefined;
      let data: Activity[];
      if (filterCourseId) {
        data = await listActivitiesByCourse(filterCourseId);
      } else if (filterWorkshopId) {
        data = await listActivitiesByWorkshop(filterWorkshopId);
      } else {
        // Vista agregada para alumnos: actividades de todas las clases en las que está unido
        const joinedCourses = await listCourses();
        const results = await Promise.all(
          (joinedCourses || []).map((c) => listActivitiesByCourse(c.id!))
        );
        const merged: Activity[] = [];
        const seen = new Set<string>();
        for (const arr of results) {
          for (const it of arr) {
            if (!it?.id) continue;
            if (seen.has(it.id)) continue;
            seen.add(it.id);
            merged.push(it);
          }
        }
        data = merged;
      }
      setItems(data);
      // Normalización persistente de URLs antiguas de adjuntos guardadas en Firestore
      // Reescribe las URLs con `getDownloadURL` para evitar errores `o?name=` en el futuro
      try {
        await Promise.all(
          (data || []).map(async (item) => {
            const atts = (item as any)?.attachments;
            if (!Array.isArray(atts) || atts.length === 0) return;
            const needsFix = atts.some(
              (a: any) =>
                typeof a?.url === "string" && a.url.includes("/o?name=")
            );
            if (!needsFix) return;
            const fixed = await Promise.all(
              atts.map(async (a: any) => {
                if (typeof a?.url === "string" && a.url.includes("/o?name=")) {
                  try {
                    const urlObj = new URL(a.url);
                    const rawName = urlObj.searchParams.get("name") || "";
                    const path = decodeURIComponent(rawName);
                    const r = ref(storage, path);
                    const newUrl = await getDownloadURL(r);
                    return { ...a, url: newUrl };
                  } catch {
                    return a;
                  }
                }
                return a;
              })
            );
            try {
              await updateActivity(item.id!, { attachments: fixed as any });
              // Actualizar en memoria para reflejar el cambio sin esperar recarga
              setItems((prev) =>
                prev.map((it) =>
                  it.id === item.id ? { ...it, attachments: fixed } : it
                )
              );
            } catch {}
          })
        );
      } catch {}
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar actividades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    // Cargar nombres de cursos para mostrar asignaciones
    listCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  // Info de vencimiento para estilos y filtro "Vencidas"
  const getDueInfo = (
    due?: string,
    completed?: boolean
  ): { kind?: "overdue" | "today" | "tomorrow" | "date"; label?: string } => {
    if (!due) return {};
    try {
      const now = new Date();
      const d = new Date(due);
      // Normalizar a inicio de día
      now.setHours(0, 0, 0, 0);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (!completed && diffDays < 0)
        return { kind: "overdue", label: "Vencida" };
      if (diffDays === 0) return { kind: "today", label: "Vence Hoy" };
      if (diffDays === 1) return { kind: "tomorrow", label: "Vence Mañana" };
      return { kind: "date", label: `Vence ${d.toLocaleDateString()}` };
    } catch {
      return {};
    }
  };

  const filterCourseId = (route as any)?.params?.filterCourseId as
    | string
    | undefined;
  // Sincroniza filtro local cuando cambian los params de navegación
  useEffect(() => {
    setCourseFilterId(filterCourseId);
  }, [filterCourseId]);
  const filterWorkshopId = (route as any)?.params?.filterWorkshopId as
    | string
    | undefined;
  const effectiveCourseId = courseFilterId || filterCourseId;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      // Filtro estricto por curso/taller si vienen en la ruta o filtro manual
      if (effectiveCourseId) {
        const inCourse =
          item.courseId === effectiveCourseId ||
          (item.courseIds || []).includes(effectiveCourseId);
        if (!inCourse) return false;
      }
      if (filterWorkshopId) {
        if ((item.workshopId || "") !== filterWorkshopId) return false;
      }
      // Mostrar todas las categorías, incluida "Asistencia"
      const matchesText =
        (item.title ?? "").toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q);
      const dueInfo = getDueInfo(item.dueDate, item.completed);
      const isOverdue = dueInfo.kind === "overdue";
      const matchesFilter =
        filter === "Todas" ||
        (filter === "Pendientes" && !item.completed) ||
        (filter === "Completadas" && !!item.completed) ||
        (filter === "Vencidas" && isOverdue);
      return matchesText && matchesFilter;
    });
  }, [items, query, filter, effectiveCourseId, filterWorkshopId]);

  const toggleCompleted = async (id?: string, current?: boolean) => {
    if (!id) return;
    try {
      await updateActivity(id, { completed: !current });
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, completed: !current } : it))
      );
    } catch (e) {}
  };

  const onDelete = async (id?: string) => {
    if (!id) return;
    Alert.alert("Eliminar actividad", "¿Seguro que deseas eliminarla?", [
      { text: "Cancelar" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteActivity(id);
          load();
        },
      },
    ]);
  };

  // filterCourseId definido arriba para evitar TDZ al usarlo en useMemo
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === filterCourseId),
    [courses, filterCourseId]
  );
  const isOwner =
    (selectedCourse?.ownerId ?? "") === (auth?.currentUser?.uid || "");

  // Normaliza URLs antiguas de Storage con formato REST `o?name=` y devuelve `getDownloadURL`
  const resolveAttachmentUrl = async (att: {
    url: string;
  }): Promise<string | undefined> => {
    const u = att?.url || "";
    try {
      if (u.includes("/o?name=")) {
        const urlObj = new URL(u);
        const rawName = urlObj.searchParams.get("name") || "";
        const path = decodeURIComponent(rawName);
        const r = ref(storage, path);
        const fixed = await getDownloadURL(r);
        return fixed;
      }
      return u;
    } catch {
      // Si no podemos convertir el URL legacy, devolvemos undefined para evitar solicitar `o?name=`
      return undefined;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="clipboard-list"
            size={18}
            color={T.text}
          />
          <Text style={[styles.title, { color: T.text }]}>Actividades</Text>
        </View>
        <View style={styles.headerActions}>
          {!!filterCourseId && (
            <NeonButton
              title="Alumnos"
              onPress={() =>
                navigation.navigate("StudentStudents", { filterCourseId })
              }
              colors={{ ...colors, primary: T.accent } as any}
              shadowRadius={12}
              elevation={6}
              style={[
                styles.addBtn,
                { backgroundColor: T.accent, marginRight: 8 },
              ]}
              textStyle={styles.addText}
            />
          )}
        </View>
      </View>

      {/* (Popup de clases movido debajo del buscador) */}

      {/* Alumnos: no se muestra popup de código */}

      {/* Barra de búsqueda (glass) */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            Platform.OS === "web"
              ? ({
                  backgroundColor: "rgba(42,42,58,0.7)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                } as any)
              : { backgroundColor: HEX.card },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={16} color={T.accent} />
          <TextInput
            placeholder="Buscar actividades..."
            placeholderTextColor={T.textMuted}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: T.text }]}
          />
        </View>
      </View>

      {/* (Popup de clases reubicado debajo del filtrador) */}

      {/* Filtros de estado + botón "Clases" junto a "Todas" */}
      <View style={styles.filtersRow}>
        <Text style={[styles.filterLabel, { color: T.text }]}>Estado:</Text>
        {/* Botón de estado: Todas */}
        {(["Todas"] as const).map((f) => {
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.chip,
                active && styles.chipActive,
                { borderColor: T.accent },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                  { color: active ? T.bg : T.text },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* Botón para desplegar el filtrador de clases */}
        {!filterCourseId && (
          <TouchableOpacity
            onPress={() => setShowClassFilter((v) => !v)}
            style={[
              styles.chip,
              showClassFilter && styles.chipActive,
              { borderColor: T.accent },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                showClassFilter && styles.chipTextActive,
                { color: showClassFilter ? T.bg : T.text },
              ]}
            >
              Clases
            </Text>
          </TouchableOpacity>
        )}
        {/* Resto de estados */}
        {(["Pendientes", "Completadas", "Vencidas"] as const).map((f) => {
          const active = filter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.chip,
                active && styles.chipActive,
                { borderColor: T.accent },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  active && styles.chipTextActive,
                  { color: active ? T.bg : T.text },
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Popup de clases: aparece debajo del filtrador */}
      {!filterCourseId && showClassFilter && (
        <View
          style={[
            styles.menu,
            {
              borderColor: T.border,
              backgroundColor:
                Platform.OS === "web" ? "rgba(42,42,58,0.7)" : T.card,
            },
          ]}
        >
          {[
            { id: undefined, title: "Todas las clases" },
            ...courses.map((c) => ({ id: c.id!, title: c.title })),
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={(item.id ?? "all") + ""}
              onPress={() => {
                setCourseFilterId(item.id);
                setShowClassFilter(false);
              }}
              style={[
                styles.menuItem,
                {
                  borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                  borderBottomColor: T.border,
                },
              ]}
            >
              <Text style={[styles.menuText, { color: T.text }]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      )}
      {!!error && (
        <Text style={[styles.error, { color: T.prioHigh }]}>{error}</Text>
      )}

      {!loading && filtered.length === 0 && (
        <Text style={[styles.empty, { color: HEX.textMuted }]}>
          No hay actividades que coincidan.
        </Text>
      )}

      {/* Tarjetas estilo glassmorphism */}
      {!loading &&
        filtered.map((item) => {
          const prioColor =
            item.priority === "alta"
              ? HEX.prioHigh
              : item.priority === "media"
              ? HEX.prioMedium
              : HEX.prioLow;
          const coursesText =
            Array.isArray(item.courseIds) && item.courseIds.length > 0
              ? item.courseIds.map((id) => courseTitleById[id] ?? id).join(", ")
              : item.courseId
              ? courseTitleById[item.courseId] ?? item.courseId
              : undefined;
          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  borderColor: T.border,
                  backgroundColor:
                    Platform.OS === "web" ? "rgba(42,42,58,0.7)" : T.card,
                },
                Platform.OS === "web"
                  ? ({
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                    } as any)
                  : {},
              ]}
            >
              <View style={[styles.leftBar, { backgroundColor: prioColor }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <TouchableOpacity
                    onPress={() => toggleCompleted(item.id, item.completed)}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: HEX.textMuted,
                        backgroundColor: item.completed
                          ? HEX.prioLow
                          : "transparent",
                      },
                    ]}
                  >
                    {item.completed && (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={HEX.text}
                      />
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.cardTitle, { color: HEX.text }]}>
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("ActivityCreate", { editItem: item })
                    }
                  >
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={T.accent}
                    />
                  </TouchableOpacity>
                </View>

                {!!item.description && (
                  <Text style={[styles.cardDesc, { color: HEX.textMuted }]}>
                    {item.description}
                  </Text>
                )}

                <View style={styles.badgesRow}>
                  {!!item.dueDate &&
                    (() => {
                      const info = getDueInfo(item.dueDate, item.completed);
                      const sty =
                        info.kind === "overdue"
                          ? {
                              backgroundColor: "rgba(248,113,113,0.15)",
                              borderColor: "#F87171",
                            }
                          : info.kind === "today"
                          ? {
                              backgroundColor: "rgba(76,123,243,0.15)",
                              borderColor: "#4C7BF3",
                            }
                          : info.kind === "tomorrow"
                          ? {
                              backgroundColor: "rgba(60,179,113,0.15)",
                              borderColor: "#3CB371",
                            }
                          : {
                              backgroundColor: "rgba(96,165,250,0.12)",
                              borderColor: T.accent,
                            };
                      const icon =
                        info.kind === "overdue"
                          ? "alert-circle"
                          : "calendar-month";
                      return (
                        <View style={[styles.badge, sty]}>
                          <MaterialCommunityIcons
                            name={icon as any}
                            size={14}
                            color={HEX.text}
                          />
                          <Text style={[styles.badgeText, { color: HEX.text }]}>
                            {info.label}
                          </Text>
                        </View>
                      );
                    })()}
                  {!!coursesText && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: "rgba(96,165,250,0.15)",
                          borderColor: T.accent,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="book-open-variant"
                        size={14}
                        color={HEX.text}
                      />
                      <Text style={[styles.badgeText, { color: HEX.text }]}>
                        {coursesText}
                      </Text>
                    </View>
                  )}
                  {!!item.priority && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: "transparent",
                          borderColor: prioColor,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          item.priority === "alta"
                            ? "alert-circle"
                            : item.priority === "media"
                            ? "alert"
                            : "check-circle"
                        }
                        size={14}
                        color={prioColor}
                      />
                      <Text style={[styles.badgeText, { color: HEX.text }]}>
                        {item.priority[0].toUpperCase() +
                          item.priority.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>

                {!!item.workshopId && (
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: "rgba(96,165,250,0.15)",
                          borderColor: T.accent,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="hammer-wrench"
                        size={14}
                        color={HEX.text}
                      />
                      <Text style={[styles.badgeText, { color: HEX.text }]}>
                        Taller: {item.workshopId}
                      </Text>
                    </View>
                  </View>
                )}

                {!!(item as any)?.attachments?.length && (
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: "rgba(96,165,250,0.12)",
                          borderColor: T.accent,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="paperclip"
                        size={14}
                        color={HEX.text}
                      />
                      <Text style={[styles.badgeText, { color: HEX.text }]}>
                        Adjunto disponible
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          const att = (item as any)?.attachments?.[0];
                          if (!att?.url) return;
                          const url = await resolveAttachmentUrl(att);
                          if (!url) {
                            Alert.alert(
                              "Aviso",
                              "El adjunto no está disponible o su URL es inválido."
                            );
                            return;
                          }
                          const filename = att.name || `archivo_${Date.now()}`;
                          await handleDownload(url, filename);
                          Alert.alert("Aviso", url);
                          Alert.alert("Aviso", filename);
                        } catch {
                          Alert.alert(
                            "Aviso",
                            "No se pudo abrir ni descargar el adjunto"
                          );
                        }
                      }}
                      style={[
                        styles.badge,
                        {
                          backgroundColor: "transparent",
                          borderColor: T.accent,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="download"
                        size={14}
                        color={T.accent}
                      />
                      <Text style={[styles.badgeText, { color: T.accent }]}>
                        Descargar
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginLeft: 8 },
  searchRow: { marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: "#60a5fa" },
  chipText: { fontSize: 12, fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  // Dropdown de clases
  menu: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
    maxHeight: 240,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  menuText: { fontSize: 14 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addText: { fontSize: 12, fontWeight: "bold", color: "#fff" },
  error: { textAlign: "center", marginTop: 16 },
  empty: { textAlign: "center", marginTop: 32, fontSize: 16 },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  leftBar: { width: 4 },
  cardContent: { flex: 1, padding: 12 },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "600", marginLeft: 8 },
  cardDesc: { fontSize: 14, marginBottom: 8 },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
  },
  badgeText: { fontSize: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
