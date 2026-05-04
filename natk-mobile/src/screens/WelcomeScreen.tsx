/**
 * Role Selection Screen
 * First screen shown when app opens
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { UserRole } from '../types';
import { COLORS } from '../utils/constants';

interface WelcomeScreenProps {
  onRoleSelect: (role: UserRole) => void;
}

interface RoleOption {
  role: UserRole;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  description: string;
}

export default function WelcomeScreen({ onRoleSelect }: WelcomeScreenProps) {
  const roles: RoleOption[] = [
    {
      role: 'applicant',
      title: 'Абитуриент',
      icon: 'book-open',
      color: COLORS.indigo,
      description: 'Информация о поступлении и специальностях',
    },
    {
      role: 'student',
      title: 'Студент',
      icon: 'calendar',
      color: COLORS.primary,
      description: 'Расписание, новости и контакты',
    },
    {
      role: 'teacher',
      title: 'Преподаватель',
      icon: 'briefcase',
      color: COLORS.amber,
      description: 'Расписание и документы',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>НАТК</Text>
        <Text style={styles.subtitle}>
          Нижегородский авиационный технический колледж
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Кто вы?</Text>
        <Text style={styles.description}>
          Выберите вашу роль для персонализированного интерфейса
        </Text>

        <View style={styles.rolesContainer}>
          {roles.map((item) => (
            <TouchableOpacity
              key={item.role}
              style={styles.roleCard}
              onPress={() => onRoleSelect(item.role)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Feather name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>{item.title}</Text>
                <Text style={styles.roleDescription}>{item.description}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>НАТК © 2026</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.indigo,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  rolesContainer: {
    gap: 12,
  },
  roleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
