/**
 * Specialties Screen
 * List of all college specialties
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSpecialties } from '../../api/client';
import { ISpecialty } from '../../types';
import { COLORS, TAB_BAR_HEIGHT } from '../../utils/constants';

export default function SpecialtiesScreen() {
  const [specialties, setSpecialties] = useState<ISpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      const data = await getSpecialties();
      setSpecialties(data);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить специальности');
    } finally {
      setLoading(false);
    }
  };

  const renderSpecialty = ({ item }: { item: ISpecialty }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.codeContainer}>
        <Text style={styles.code}>{item.code}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.detail}>Кампус: {typeof item.campus === 'string' ? item.campus : item.campus?.address}</Text>
          {item.budgetPlaces !== undefined && (
            <Text style={styles.detail}>Бюджетных мест: {item.budgetPlaces}</Text>
          )}
        </View>
        {item.passingScore && (
          <Text style={styles.passingScore}>
            Проходной балл: {item.passingScore}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Загрузка специальностей...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSpecialties}>
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Специальности</Text>
        <Text style={styles.headerSubtitle}>
          {specialties.length} специальностей доступно
        </Text>
      </View>
      <FlatList
        data={specialties}
        renderItem={renderSpecialty}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.indigo,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: TAB_BAR_HEIGHT,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: COLORS.indigo + '15',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  code: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.indigo,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  qualification: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  passingScore: {
    fontSize: 13,
    color: COLORS.success,
    marginTop: 8,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
