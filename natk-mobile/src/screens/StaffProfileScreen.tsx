/**
 * Staff Profile Screen
 * Detailed view of a staff member
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import { IStaff } from '../types';
import { COLORS } from '../utils/constants';

interface StaffProfileScreenProps {
  staff: IStaff;
  onBack?: () => void;
}

// Clean HTML from bio (similar to frontend logic)
const cleanBioHtml = (html?: string): string => {
  if (!html) return '';
  
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function StaffProfileScreen({ staff, onBack }: StaffProfileScreenProps) {
  const openProfileUrl = async () => {
    if (staff.profileUrl) {
      try {
        await Linking.openURL(staff.profileUrl);
      } catch (error) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  const bioText = cleanBioHtml(staff.bioHtml);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {staff.photoUrl ? (
            <Image source={{ uri: staff.photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>
                {staff.fullName.charAt(0)}
              </Text>
            </View>
          )}
          
          <Text style={styles.name}>{staff.fullName}</Text>
          
          {staff.positions.map((pos, idx) => (
            <Text key={idx} style={styles.position}>
              {pos.positionName}
            </Text>
          ))}

          {staff.role === 'CHIEF' && (
            <View style={styles.chiefBadge}>
              <Text style={styles.chiefBadgeText}>★ Руководство</Text>
            </View>
          )}
        </View>

        {/* Bio Section */}
        {bioText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Биография</Text>
            <Text style={styles.bioText}>{bioText}</Text>
          </View>
        )}

        {/* Achievements Section */}
        {staff.achievements && staff.achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Достижения</Text>
            {staff.achievements.map((achievement, idx) => (
              <View key={idx} style={styles.achievementItem}>
                <Text style={styles.achievementBullet}>•</Text>
                <Text style={styles.achievementText}>{achievement}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Profile Link */}
        {staff.profileUrl && (
          <TouchableOpacity style={styles.profileLink} onPress={openProfileUrl}>
            <Text style={styles.profileLinkText}>
              Открыть профиль на сайте
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: COLORS.surface,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  position: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  chiefBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  chiefBadgeText: {
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.surface,
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  achievementItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  achievementBullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 8,
  },
  achievementText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
  },
  profileLink: {
    backgroundColor: COLORS.primary,
    margin: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  profileLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
