import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  Pressable 
} from 'react-native';

interface ToastProps {
  message: string;
  code?: string;
  onAction?: () => void;
  actionText?: string;
  duration?: number;
  onHide?: () => void;
}

export const Toast = ({ 
  message, 
  code, 
  onAction, 
  actionText = "Fix It", 
  duration = 5000, 
  onHide 
}: ToastProps) => {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  }, [message]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.textContainer}>
        {code && <Text style={styles.code}>Error {code}:</Text>}
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      {onAction && (
        <Pressable onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionText}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  code: {
    color: '#999',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderRadius: 4,
  },
  actionText: {
    color: '#1DB954',
    fontSize: 13,
    fontWeight: '700',
  },
});