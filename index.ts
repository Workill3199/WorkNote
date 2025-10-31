// Punto de entrada para registrar el componente raíz con Expo.
// Asegura entorno correcto tanto en Expo Go como en builds nativas.
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
