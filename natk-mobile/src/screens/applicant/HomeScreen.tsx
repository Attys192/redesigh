/**
 * Applicant Home Screen
 * Main landing page for applicants
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

interface CardItem {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export default function HomeScreen() {
  const cards: CardItem[] = [
    {
      title: 'Профориентационный тест',
      description: 'Пройдите тест и узнайте, какая специальность вам подходит',
      icon: 'clipboard',
      color: COLORS.indigo,
    },
    {
      title: 'Специальности',
      description: 'Изучите все специальности колледжа и выберите подходящую',
      icon: 'book-open',
      color: COLORS.primary,
    },
    {
      title: 'Калькулятор баллов',
      description: 'Рассчитайте средний балл и узнайте шансы на поступление',
      icon: 'hash',
      color: COLORS.success,
    },
    {
      title: 'Документы',
      description: 'Необходимые документы для поступления',
      icon: 'file-text',
      color: COLORS.warning,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Feather name="send" size={14} color={COLORS.indigo} />
            <Text style={styles.badgeText}>Приемная кампания 2026</Text>
          </View>
          <Text style={styles.title}>Добро пожаловать в НАТК!</Text>
          <Text style={styles.subtitle}>
            Начни свой путь в авиации и IT вместе с ведущим колледжем региона
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {cards.map((card, index) => (
            <TouchableOpacity key={index} style={styles.card} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: card.color + '15' }]}>
                <Feather name={card.icon} size={24} color={card.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 28,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.indigo + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.indigo,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
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
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
