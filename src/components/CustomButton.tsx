import { Pressable, Text, StyleSheet, PressableProps } from "react-native";
import { forwardRef } from "react";

type CustomButtonProps = {
    text: string;
} & PressableProps

const CustomButton = forwardRef<typeof Pressable, CustomButtonProps>(({
    text, 
    style,
    ...props
}, ref) => {
    const isTransparent = style && (style as any).backgroundColor === 'transparent';
    
    return (
        <Pressable ref={ref as any} {...props} style={[styles.button, style as any]}>
            <Text style={[
                styles.buttonText, 
                isTransparent && styles.transparentButtonText
            ]}>{text}</Text>
        </Pressable>
    );
});

CustomButton.displayName = 'CustomButton';

export default CustomButton;

const styles = StyleSheet.create({
    button:{
      backgroundColor: 'blue',
      padding: 10,
      borderRadius: 3,
      alignItems: 'center',
    },
    buttonText:{
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    transparentButtonText: {
      color: '#A881E6', // Using the purple color from your theme
    }
});
