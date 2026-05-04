/**
 * Staff Screen
 * List of all staff members
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IStaff } from '../types';
import { getStaff } from '../api/client';
import { COLORS, TAB_BAR_HEIGHT } from '../utils/constants';

interface StaffScreenProps {
  onStaffPress?: (staff: IStaff) => void;
}

export default function StaffScreen({ onStaffPress }: StaffScreenProps) {
  const [staff, setStaff] = useState<IStaff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<IStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchQuery]);

  const loadStaff = async () => {
    try {
      const data = await getStaff();
      setStaff(data);
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    if (!searchQuery.trim()) {
      setFilteredStaff(staff);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStaff(
        staff.filter(
          s =>
            s.fullName.toLowerCase().includes(query) ||
            s.positions.some(p => p.positionName.toLowerCase().includes(query))
        )
      );
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStaff();
    setRefreshing(false);
  }, []);

  const renderStaffItem = ({ item }: { item: IStaff }) => (
    <TouchableOpacity
      style={styles.staffCard}
      onPress={() => onStaffPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.photoContainer}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>
              {item.fullName.charAt(0)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={2}>
          {item.fullName}
        </Text>
        {item.positions.map((pos, idx) => (
          <Text key={idx} style={styles.position} numberOfLines={1}>
            {pos.positionName}
          </Text>
        ))}
        {item.role === 'CHIEF' && (
          <View style={styles.chiefBadge}>
            <Text style={styles.chiefBadgeText}>Руководство</Text>
          </View>
        )}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Сотрудники</Text>
        <Text style={styles.headerSubtitle}>Преподаватели и руководство</Text>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>Поиск</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по ФИО или должности..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredStaff}
        renderItem={renderStaffItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIconText}>?</Text>
            </View>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Ничего не найдено' : 'Сотрудники не найдены'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: TAB_BAR_HEIGHT,
  },
  staffCard: {
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
  photoContainer: {
    marginRight: 16,
  },
  photo: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  photoPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  position: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chiefBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  chiefBadgeText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
