import React from 'react';
import {SafeAreaView, StyleSheet, ViewStyle} from 'react-native';

type Props = {
  backgroundColor: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export const Screen = ({backgroundColor, children, style}: Props) => (
  <SafeAreaView style={[styles.root, {backgroundColor}, style]}>{children}</SafeAreaView>
);

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});
