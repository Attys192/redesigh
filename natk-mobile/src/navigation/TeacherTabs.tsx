/**
 * Teacher Tab Navigation
 * Tabs: Моё расписание, Структура, Новости
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

// Placeholder screens
const MyScheduleScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Моё расписание</Text>
  </View>
);

const StructureScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Структура</Text>
  </View>
);

const TeacherNewsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Новости</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export default function TeacherTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.amber,
        tabBarInactiveTintColor: COLORS.textSecondary,
      }}
    >
      <Tab.Screen
        name="MySchedule"
        component={MyScheduleScreen}
        options={{
          tabBarLabel: 'Расписание',
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Structure"
        component={StructureScreen}
        options={{
          tabBarLabel: 'Структура',
          tabBarIcon: ({ color, size }) => (
            <Feather name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="News"
        component={TeacherNewsScreen}
        options={{
          tabBarLabel: 'Новости',
          tabBarIcon: ({ color, size }) => (
            <Feather name="rss" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    fontSize: 18,
    color: COLORS.text,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 8,
    paddingTop: 8,
    height: 65,
  },
});
