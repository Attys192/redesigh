import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { UserRole } from './src/types';

import WelcomeScreen from './src/screens/WelcomeScreen';
import StudentTabs from './src/navigation/StudentTabs';
import ApplicantTabs from './src/navigation/ApplicantTabs';
import TeacherTabs from './src/navigation/TeacherTabs';
import { getUserRole, saveUserRole } from './src/utils/storage';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    checkStoredRole();
  }, []);

  const checkStoredRole = async () => {
    try {
      const storedRole = await getUserRole();
      if (storedRole) {
        setUserRole(storedRole);
      }
    } catch (error) {
      console.log('Error loading stored role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = async (role: UserRole) => {
    try {
      await saveUserRole(role);
      setUserRole(role);
    } catch (error) {
      console.log('Error saving role:', error);
      setUserRole(role);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!userRole ? (
            <Stack.Screen name="Welcome">
              {() => <WelcomeScreen onRoleSelect={handleRoleSelect} />}
            </Stack.Screen>
          ) : (
            <>
              {userRole === 'student' && (
                <Stack.Screen name="StudentMain" component={StudentTabs} />
              )}
              {userRole === 'applicant' && (
                <Stack.Screen name="ApplicantMain" component={ApplicantTabs} />
              )}
              {userRole === 'teacher' && (
                <Stack.Screen name="TeacherMain" component={TeacherTabs} />
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

