import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScheduleScreen from '../screens/ScheduleScreen';
import NewsScreen from '../screens/NewsScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import StaffScreen from '../screens/StaffScreen';
import StaffProfileScreen from '../screens/StaffProfileScreen';
import { IStaff } from '../types';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();

// Staff tab wrapper to handle navigation to profile
function StaffTab() {
  const [selectedStaff, setSelectedStaff] = useState<IStaff | null>(null);

  if (selectedStaff) {
    return (
      <StaffProfileScreen
        staff={selectedStaff}
        onBack={() => setSelectedStaff(null)}
      />
    );
  }

  return <StaffScreen onStaffPress={setSelectedStaff} />;
}

export default function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ 
          tabBarLabel: 'Расписание',
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="News" 
        component={NewsScreen}
        options={{ 
          tabBarLabel: 'Новости',
          tabBarIcon: ({ color, size }) => (
            <Feather name="rss" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{ 
          tabBarLabel: 'Документы',
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Staff" 
        component={StaffTab}
        options={{ 
          tabBarLabel: 'Сотрудники',
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 65,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
