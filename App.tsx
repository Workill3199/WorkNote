import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/profesores/RegisterScreen';
import HomeScreen from './src/screens/profesores/HomeScreen';
import CoursesListScreen from './src/screens/profesores/CoursesListScreen';
import CourseCreateScreen from './src/screens/profesores/CourseCreateScreen';
import WorkshopsListScreen from './src/screens/profesores/WorkshopsListScreen';
import WorkshopCreateScreen from './src/screens/profesores/WorkshopCreateScreen';
import ActivitiesListScreen from './src/screens/profesores/ActivitiesListScreen';
import ActivityCreateScreen from './src/screens/profesores/ActivityCreateScreen';
import StudentsListScreen from './src/screens/profesores/StudentsListScreen';
import StudentCreateScreen from './src/screens/profesores/StudentCreateScreen';
import AttendanceScreen from './src/screens/profesores/AttendanceScreen';
import { DarkThemeCustom } from './src/theme/navigation';
import { darkColors } from './src/theme/colors';
import MoreScreen from './src/screens/profesores/MoreScreen';
import ProfileSettingsScreen from './src/screens/profesores/ProfileSettingsScreen';
import React from 'react';
import { ConfigProvider, useConfig } from './src/context/ConfigContext';
import NotificationsSettingsScreen from './src/screens/profesores/NotificationsSettingsScreen';
import PrivacySettingsScreen from './src/screens/profesores/PrivacySettingsScreen';
import PrivacyPolicyScreen from './src/screens/profesores/PrivacyPolicyScreen';
import TermsScreen from './src/screens/profesores/TermsScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import './src/i18n';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Manrope_700Bold } from '@expo-google-fonts/manrope';
import { fonts } from './src/theme/typography';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const isWeb = Platform.OS === 'web';
  const [navOpacity, setNavOpacity] = React.useState(0.98);
  const [navBlur, setNavBlur] = React.useState(24);

  React.useEffect(() => {
    if (!isWeb) return;
    const onScroll = () => {
      const y = (window.scrollY || 0);
      const maxOpacity = 0.98;
      const minOpacity = 0.55;
      const opacity = Math.max(minOpacity, Math.min(maxOpacity, maxOpacity - (y / 400) * 0.35));
      const blur = Math.min(28, 18 + y / 50);
      setNavOpacity(opacity);
      setNavBlur(blur);
    };
    window.addEventListener('scroll', onScroll, { passive: true } as any);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isWeb]);
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: (
            Platform.OS === 'web'
              ? ({
                  // Estilo solicitado: fixed bottom, z-index alto, borde blanco suave,
                  // fondo azul oscuro casi opaco, blur XL y sombra hacia arriba
                  position: 'fixed',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  zIndex: 100,
                  backgroundColor: `rgba(10, 14, 26, ${navOpacity})`, // #0a0e1a con transparencia dinámica
                  backdropFilter: `blur(${navBlur}px)`,
                  WebkitBackdropFilter: `blur(${navBlur}px)`,
                  borderTopColor: 'rgba(255,255,255,0.1)', // border-white/10
                  borderTopWidth: 1,
                  boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
                  paddingBottom: 10,
                  paddingTop: 10,
                } as any)
              : {
                  // En móvil, fondo oscuro casi opaco y sombra suave (sin blur)
                  backgroundColor: 'rgba(10, 14, 26, 0.98)',
                  borderTopColor: 'rgba(255,255,255,0.1)',
                  borderTopWidth: 1,
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: -4 },
                  elevation: 12,
                  display:  "flex",
                }
          ),
          tabBarItemStyle: { paddingVertical: 6 },
          tabBarIconStyle: { marginBottom: 0 },
          tabBarActiveTintColor: darkColors.primary,
          tabBarInactiveTintColor: darkColors.mutedText,
          tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
          tabBarIcon: ({ color, size }) => {
            const iconSize = 20;
            const name =
              route.name === 'Inicio'
                ? 'home'
                : route.name === 'Clases'
                ? 'book-open-variant'
                : route.name === 'Estudiantes'
                ? 'account-group'
                : route.name === 'Actividades'
                ? 'clipboard-list'
                : 'cog';
            return <MaterialCommunityIcons name={name as any} size={iconSize} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} />
        <Tab.Screen name="Clases" component={CoursesListScreen} />
        <Tab.Screen name="Estudiantes" component={StudentsListScreen} />
        <Tab.Screen name="Actividades" component={ActivitiesListScreen} />
      </Tab.Navigator>
      {/* Botón flotante central para crear */}
      {/* FAB eliminado a pedido del usuario */}
    </View>
  );
}

function AppNavigation() {
  const theme = DarkThemeCustom;
  const headerColors = { card: darkColors.card, text: darkColors.text };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: headerColors.card },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: fonts.bold },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        {/* Rutas internas usadas por acciones del Home */}
        <Stack.Screen name="Courses" component={CoursesListScreen} options={{ title: 'Cursos' }} />
        <Stack.Screen name="CourseCreate" component={CourseCreateScreen} options={{ title: 'Nuevo Curso' }} />
        <Stack.Screen name="Workshops" component={WorkshopsListScreen} options={{ title: 'Talleres' }} />
        <Stack.Screen name="WorkshopCreate" component={WorkshopCreateScreen} options={{ title: 'Nuevo Taller' }} />
        <Stack.Screen name="Activities" component={ActivitiesListScreen} options={{ title: 'Actividades' }} />
        <Stack.Screen name="ActivityCreate" component={ActivityCreateScreen} options={{ title: 'Nueva Actividad' }} />
        <Stack.Screen name="Students" component={StudentsListScreen} options={{ title: 'Estudiantes' }} />
        <Stack.Screen name="StudentCreate" component={StudentCreateScreen} options={{ title: 'Registrar Estudiante' }} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Perfil de Usuario' }} />
        <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Asistencia' }} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} options={{ title: 'Notificaciones' }} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: 'Privacidad' }} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Política de Privacidad' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Términos y Condiciones' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Manrope_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      const TextAny = Text as any;
      if (TextAny.defaultProps == null) TextAny.defaultProps = {};
      TextAny.defaultProps.style = [
        TextAny.defaultProps.style,
        { fontFamily: fonts.regular, color: '#fff', fontSize: 18, lineHeight: 24 },
      ];
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ConfigProvider>
      <AppNavigation />
    </ConfigProvider>
  );
}

const styles = StyleSheet.create({
  // Conservamos estilos si se necesitan más adelante
});
