import { Pressable, Text, StyleSheet, PressableProps, ActivityIndicator, View } from "react-native";
import { forwardRef } from "react";
import Constants from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

type CustomButtonProps = {
    text: string;
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
} & PressableProps

const CustomButton = forwardRef<typeof Pressable, CustomButtonProps>(({
    text, 
    style,
    loading,
    icon,
    iconColor = "#000",
    ...props
}, ref) => {
    // Flatten style array to correctly detect colors
    const flatStyle = StyleSheet.flatten(style || {});
    const bgColor = flatStyle.backgroundColor?.toString().toLowerCase();
    
    // Support multiple color codes that might be used for the same color
    const isGreen = bgColor === '#1d8954' || bgColor === '#1db954'; 
    const isPurple = bgColor === '#a881e6';
    const isBlue = bgColor === '#1877f2';
    const isBlack = bgColor === '#000' || bgColor === '#000000' || bgColor === 'black';
    const isTransparent = bgColor === 'transparent';
    
    return (
        <Pressable 
            ref={ref as any} 
            {...props} 
            style={[styles.button, style as any]}
            disabled={loading || props.disabled}
        >
            {loading ? (
                <ActivityIndicator color={(isGreen || isPurple || isBlue || isBlack) ? "#fff" : "#000"} />
            ) : (
                <View style={styles.content}>
                    {icon && <Ionicons name={icon} size={20} color={isGreen || isPurple || isBlue || isBlack ? "#fff" : iconColor} style={styles.icon} />}
                    <Text style={[
                        styles.buttonText, 
                        isTransparent && styles.transparentButtonText,
                        (isGreen || isPurple || isBlue || isBlack) && styles.whiteText,
                    ]}>{text}</Text>
                </View>
            )}
        </Pressable>
    );
});

CustomButton.displayName = 'CustomButton';

export default CustomButton;

const styles = StyleSheet.create({
    button:{
      backgroundColor: '#fff',
      height: 56, 
      borderRadius: 6, // Perfect pill shape
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 150,
      flexDirection: 'row',
      paddingHorizontal: 30,
      // Subtle shadow for premium feel
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    icon: {
        marginRight: 4,
    },
    buttonText:{
      color: '#000',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    transparentButtonText: {
      color: '#fff', 
      fontSize: 14,
      fontWeight: '600',
    },
    whiteText: {
        color: '#fff',
    }
});
