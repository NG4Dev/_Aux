import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, Image, StyleSheet, ImageSourcePropType, ImageStyle } from 'react-native';

type FeatureCardProps = {
  item: {
    title: string;
    description: string;
    image: ImageSourcePropType;
  };
};

export default function FeatureCard({ item }: FeatureCardProps) {
  return (
    <View style={styles.card}>
      <Image 
        source={item.image} 
        style={styles.image} 
        resizeMode="cover"
        fadeDuration={0}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
      />
      <BlurView intensity={30} style={styles.blurContainer} tint="dark">
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  image: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  } as ImageStyle,
  blurContainer: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    lineHeight: 20,
  },
});
