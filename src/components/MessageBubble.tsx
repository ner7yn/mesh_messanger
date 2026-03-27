import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ChatMessage} from '../types/models';

export const MessageBubble = ({
  message,
  incomingColor,
  outgoingColor,
  textColor
}: {
  message: ChatMessage;
  incomingColor: string;
  outgoingColor: string;
  textColor: string;
}) => {
  return (
    <View
      style={[
        styles.bubble,
        {
          backgroundColor: message.outgoing ? outgoingColor : incomingColor,
          alignSelf: message.outgoing ? 'flex-end' : 'flex-start'
        }
      ]}>
      <Text style={[styles.text, {color: textColor}]}>{message.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    borderRadius: 14,
    marginVertical: 4,
    maxWidth: '80%'
  },
  text: {
    fontSize: 16
  }
});
