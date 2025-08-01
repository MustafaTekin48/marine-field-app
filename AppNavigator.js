import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ForkliftScreen from './screens/ForkliftScreen';
import ManliftScreen from './screens/ManliftScreen';
import IskeleScreen from './screens/IskeleScreen';
import ElektrikScreen from './screens/ElektrikScreen';
import SuScreen from './screens/SuScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Forklift" component={ForkliftScreen} />
        <Stack.Screen name="Manlift" component={ManliftScreen} />
        <Stack.Screen name="Iskele" component={IskeleScreen} />
        <Stack.Screen name="Elektrik" component={ElektrikScreen} />
        <Stack.Screen name="Su" component={SuScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
