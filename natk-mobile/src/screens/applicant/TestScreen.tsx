/**
 * Pro-Test Screen
 * Career guidance test for applicants
 * SYNCED with natk-frontend/app/applicant/test/page.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TEST_QUESTIONS, SPECIALTIES, COLORS } from '../../utils/constants';

// Answer colors for visual distinction
const ANSWER_COLORS = [
  COLORS.indigo,
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.amber,
];

export default function TestScreen() {
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(1);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const currentQuestion = TEST_QUESTIONS.find(q => q.id === currentQuestionId);

  const handleAnswer = (nextId?: number, resultCode?: string) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      if (resultCode) {
        setResult(resultCode);
      } else if (nextId) {
        setHistory([...history, currentQuestionId]);
        setCurrentQuestionId(nextId);
      }
    }, 150);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prevId = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentQuestionId(prevId);
    }
  };

  const resetTest = () => {
    setCurrentQuestionId(1);
    setResult(null);
    setHistory([]);
  };

  // Result Screen
  if (result) {
    const specialty = SPECIALTIES[result];
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <View style={styles.resultBadgeLarge}>
                <Text style={styles.resultBadgeTextLarge}>Результат теста</Text>
              </View>
              <Text style={styles.resultCode}>{result}</Text>
              <Text style={styles.resultTitle}>{specialty?.title}</Text>
            </View>
            
            <View style={styles.resultInfo}>
              <Text style={styles.infoTitle}>Ваш путь начинается здесь</Text>
              <Text style={styles.infoText}>
                Эта специальность максимально соответствует вашим интересам и склонностям. 
                В НАТК вы получите все необходимые навыки для успешного старта карьеры.
              </Text>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.primaryButton} onPress={resetTest}>
                <Feather name="refresh-cw" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Пройти заново</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state
  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Вопрос не найден</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={resetTest}>
            <Text style={styles.primaryButtonText}>Начать сначала</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Question Screen
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header with back button */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={[styles.backButton, history.length === 0 && styles.backButtonHidden]}
              onPress={goBack}
              disabled={history.length === 0}
            >
              <Feather name="arrow-left" size={20} color={COLORS.textSecondary} />
              <Text style={styles.backButtonText}>Назад</Text>
            </TouchableOpacity>
            <View style={styles.testBadge}>
              <Feather name="compass" size={14} color={COLORS.textSecondary} />
              <Text style={styles.testBadgeText}>Профориентация</Text>
            </View>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(currentQuestionId / 6) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>Вопрос {currentQuestionId} из 6</Text>
          </View>

          {/* Question */}
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
          <Text style={styles.questionHint}>Выберите один из вариантов</Text>

          {/* Answers */}
          <View style={styles.answersContainer}>
            {currentQuestion.answers.map((answer, index) => (
              <TouchableOpacity
                key={index}
                style={styles.answerCard}
                onPress={() => handleAnswer(answer.nextQuestionId, answer.resultCode)}
                activeOpacity={0.7}
              >
                <View style={[styles.answerIndicator, { backgroundColor: ANSWER_COLORS[index % ANSWER_COLORS.length] }]} />
                <Text style={styles.answerText}>{answer.text}</Text>
                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer hint */}
          <Text style={styles.footerHint}>
            Тест поможет сузить круг выбора специальностей на основе ваших предпочтений.
          </Text>
        </Animated.View>
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
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonHidden: {
    opacity: 0,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  testBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Progress
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.indigo,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

  // Question
  questionText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 34,
    textAlign: 'center',
  },
  questionHint: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },

  // Answers
  answersContainer: {
    gap: 12,
  },
  answerCard: {
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
  answerIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 14,
  },
  answerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },

  // Footer
  footerHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 18,
  },

  // Result
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    backgroundColor: COLORS.indigo,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  resultBadgeLarge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultBadgeTextLarge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  resultCode: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },

  resultInfo: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  resultActions: {
    gap: 12,
  },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.indigo,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Error
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    marginBottom: 20,
    textAlign: 'center',
  },
});
