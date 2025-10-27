import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CoursesListScreen from './src/screens/CoursesListScreen';
import CourseCreateScreen from './src/screens/CourseCreateScreen';
import WorkshopsListScreen from './src/screens/WorkshopsListScreen';
import WorkshopCreateScreen from './src/screens/WorkshopCreateScreen';
import ActivitiesListScreen from './src/screens/ActivitiesListScreen';
import ActivityCreateScreen from './src/screens/ActivityCreateScreen';
import StudentsListScreen from './src/screens/StudentsListScreen';
import StudentCreateScreen from './src/screens/StudentCreateScreen';
import { DarkThemeCustom } from './src/theme/navigation';
import { darkColors } from './src/theme/colors';
import MoreScreen from './src/screens/MoreScreen';
import ProfileSettingsScreen from './src/screens/ProfileSettingsScreen';
import React from 'react';
import { ConfigProvider, useConfig } from './src/context/ConfigContext';
import NotificationsSettingsScreen from './src/screens/NotificationsSettingsScreen';
import PrivacySettingsScreen from './src/screens/PrivacySettingsScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsScreen from './src/screens/TermsScreen';
import './src/i18n';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Manrope_700Bold } from '@expo-google-fonts/manrope';
import { fonts } from './src/theme/typography';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: darkColors.card, borderTopColor: darkColors.border },
          tabBarActiveTintColor: darkColors.primary,
          tabBarInactiveTintColor: darkColors.mutedText,
          tabBarLabelStyle: { fontFamily: fonts.medium },
          tabBarIcon: ({ color, size }) => {
            const name =
              route.name === 'Inicio'
                ? 'home'
                : route.name === 'Clases'
                ? 'book-open-variant'
                : route.name === 'Estudiantes'
                ? 'account-group'
                : 'cog';
            return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} />
        <Tab.Screen name="Clases" component={CoursesListScreen} />
        <Tab.Screen name="Estudiantes" component={StudentsListScreen} />
        <Tab.Screen name="Ajustes" component={MoreScreen} />
      </Tab.Navigator>
      {/* Botón flotante central para crear */}
      <View style={{ position: 'absolute', bottom: 26, left: 0, right: 0, alignItems: 'center' }}>
      <TouchableOpacity
           onPress={() => navigation.getParent()?.navigate('ActivityCreate')}
           style={{
             borderWidth: 1,
             borderColor: darkColors.primary,
             backgroundColor: darkColors.primary,
             width: 56,
             height: 56,
             borderRadius: 28,
             alignItems: 'center',
             justifyContent: 'center',
             shadowColor: darkColors.primary,
             shadowOpacity: 0.9,
             shadowRadius: 14,
             shadowOffset: { width: 0, height: 0 },
+            transform: [{ translateX: -28 }],
           }}
         >
           <MaterialCommunityIcons name="plus" size={28} color="#fff" />
         </TouchableOpacity>
       </View>
    </View>
  );
}

function AppNavigation() {
  const { config } = useConfig();
  const theme = DarkThemeCustom;
  const headerColors = { card: darkColors.card, text: darkColors.text };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: headerColors.card },
          headerTintColor: headerColors.text,
          headerTitleStyle: { fontFamily: fonts.bold },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
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
        <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Configuración de Perfil' }} />
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
      TextAny.defaultProps.style = [TextAny.defaultProps.style, { fontFamily: fonts.regular, color: darkColors.text }];
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
