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
    const isTransparent = style && (style as any).backgroundColor === 'transparent';
    const isGreen = style && (style as any).backgroundColor === '#1D8954'; // Spotify Green
    const isBlue = style && (style as any).backgroundColor === '#1877F2';
    const isBlack = style && (style as any).backgroundColor === '#000';
    
    return (
        <Pressable 
            ref={ref as any} 
            {...props} 
            style={[styles.button, style as any]}
            disabled={loading || props.disabled}
        >
            {loading ? (
                <ActivityIndicator color={isTransparent ? "#fff" : "#000"} />
            ) : (
                <View style={styles.content}>
                    {icon && <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />}
                    <Text style={[
                        styles.buttonText, 
                        isTransparent && styles.transparentButtonText,
                        isGreen && styles.greenButtonText,
                        isBlue && styles.whiteText,
                        isBlack && styles.whiteText
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
      paddingVertical: 14,
      borderRadius: 3, // Rectangular with slight radius
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 150,
      flexDirection: 'row',
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
      fontSize: 16,
      fontWeight: '700',
    },
    transparentButtonText: {
      color: '#fff', 
      fontSize: 14,
      fontWeight: '600',
    },
    greenButtonText: {
        color: '#000',
    },
    whiteText: {
        color: '#fff',
    }
});
