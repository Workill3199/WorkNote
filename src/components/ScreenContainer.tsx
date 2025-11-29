import React, { ReactNode } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';

type Props = {
  children: ReactNode;
  center?: boolean;
  contentPadding?: number;
  style?: ViewStyle;
};

export default function ScreenContainer({ children, center = false, contentPadding = 16, style }: Props) {
  const { colors } = useTheme();
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: contentPadding, paddingVertical: 16, justifyContent: center ? 'center' : 'flex-start' },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1 },
});

