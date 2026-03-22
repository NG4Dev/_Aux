import { View, Image, StyleSheet, ImageSourcePropType, ImageStyle } from 'react-native';

type FeatureCardProps = {
  item: {
    title: string;
    description: string;
    image: ImageSourcePropType | { uri: string };
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
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
});
