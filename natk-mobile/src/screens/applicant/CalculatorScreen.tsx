/**
 * GPA Calculator Screen
 * Calculates average grade based on 11 subject areas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SUBJECT_AREAS, COLORS, TAB_BAR_HEIGHT } from '../../utils/constants';
import { getSpecialties } from '../../api/client';
import { ISpecialty } from '../../types';

const GRADES = [2, 3, 4, 5];

export default function CalculatorScreen() {
  const [grades, setGrades] = useState<Record<string, number | null>>({});
  const [specialties, setSpecialties] = useState<ISpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageGrade, setAverageGrade] = useState<number | null>(null);

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    calculateAverage();
  }, [grades]);

  const loadSpecialties = async () => {
    try {
      const data = await getSpecialties();
      setSpecialties(data);
    } catch (err) {
      console.error('Failed to load specialties:', err);
    } finally {
      setLoading(false);
    }
  };

  const setGrade = (areaId: string, grade: number | null) => {
    setGrades(prev => ({ ...prev, [areaId]: grade }));
  };

  const calculateAverage = () => {
    const values = Object.values(grades).filter((g): g is number => g !== null);
    if (values.length === 0) {
      setAverageGrade(null);
      return;
    }
    const sum = values.reduce((a, b) => a + b, 0);
    setAverageGrade(sum / values.length);
  };

  const getChances = (passingScore?: number) => {
    if (!averageGrade || !passingScore) return null;
    if (averageGrade >= passingScore) return 'high';
    if (averageGrade >= passingScore - 0.5) return 'medium';
    return 'low';
  };

  const resetGrades = () => {
    setGrades({});
    setAverageGrade(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Калькулятор среднего балла</Text>
          <Text style={styles.subtitle}>
            Введите оценки по предметным областям
          </Text>
        </View>

        {averageGrade !== null && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Ваш средний балл:</Text>
            <Text style={styles.resultValue}>{averageGrade.toFixed(2)}</Text>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>
                {averageGrade >= 4.5 ? 'Отлично!' : 
                 averageGrade >= 3.5 ? 'Хорошо' : 
                 averageGrade >= 2.5 ? 'Удовлетворительно' : 'Требуется улучшение'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.gradesSection}>
          <Text style={styles.sectionTitle}>Предметные области</Text>
          {SUBJECT_AREAS.map((area) => (
            <View key={area.id} style={styles.gradeRow}>
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeTitle}>{area.title}</Text>
                <Text style={styles.gradeSubjects}>
                  {area.subjects.join(', ')}
                </Text>
              </View>
              <View style={styles.gradeButtons}>
                {GRADES.map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[
                      styles.gradeButton,
                      grades[area.id] === grade && styles.gradeButtonActive,
                    ]}
                    onPress={() => setGrade(area.id, grade)}
                  >
                    <Text
                      style={[
                        styles.gradeButtonText,
                        grades[area.id] === grade && styles.gradeButtonTextActive,
                      ]}
                    >
                      {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setGrade(area.id, null)}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {averageGrade !== null && (
          <View style={styles.specialtiesSection}>
            <Text style={styles.sectionTitle}>Ваши шансы на поступление</Text>
            {specialties.map((specialty) => {
              const chance = getChances(specialty.passingScore);
              if (!chance) return null;
              return (
                <View key={specialty.id} style={styles.chanceCard}>
                  <View style={styles.chanceInfo}>
                    <Text style={styles.chanceCode}>{specialty.code}</Text>
                    <Text style={styles.chanceTitle}>{specialty.title}</Text>
                    {specialty.passingScore && (
                      <Text style={styles.chanceScore}>
                        Проходной: {specialty.passingScore}
                      </Text>
                    )}
                  </View>
                  <View style={[
                    styles.chanceBadge,
                    chance === 'high' && styles.chanceBadgeHigh,
                    chance === 'medium' && styles.chanceBadgeMedium,
                    chance === 'low' && styles.chanceBadgeLow,
                  ]}>
                    <Text style={styles.chanceBadgeText}>
                      {chance === 'high' ? 'Высокие' :
                       chance === 'medium' ? 'Средние' : 'Низкие'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={resetGrades}>
          <Text style={styles.resetButtonText}>Сбросить все оценки</Text>
        </TouchableOpacity>
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
    paddingBottom: TAB_BAR_HEIGHT + 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.indigo,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: COLORS.indigo,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  resultLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 8,
  },
  resultBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  gradesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  gradeRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gradeInfo: {
    marginBottom: 12,
  },
  gradeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  gradeSubjects: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  gradeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gradeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  gradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  gradeButtonTextActive: {
    color: '#fff',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.error + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  specialtiesSection: {
    marginBottom: 20,
  },
  chanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chanceInfo: {
    flex: 1,
  },
  chanceCode: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.indigo,
  },
  chanceTitle: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
    fontWeight: '500',
  },
  chanceScore: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  chanceBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  chanceBadgeHigh: {
    backgroundColor: COLORS.success + '20',
  },
  chanceBadgeMedium: {
    backgroundColor: COLORS.warning + '20',
  },
  chanceBadgeLow: {
    backgroundColor: COLORS.error + '20',
  },
  chanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  resetButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
