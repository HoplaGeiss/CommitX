import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface CustomHeaderProps {
  title: string;
  onMenuPress: () => void;
  onAddPress: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, onMenuPress, onAddPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <Pressable
          onPress={onMenuPress}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            padding: 4,
          })}
          hitSlop={10}
        >
          <Ionicons name="menu" size={26} color="#ffffff" />
        </Pressable>

        <Text style={styles.title}>{title}</Text>

        <Pressable
          onPress={onAddPress}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            padding: 4,
          })}
          hitSlop={10}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#000000',
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default CustomHeader;
