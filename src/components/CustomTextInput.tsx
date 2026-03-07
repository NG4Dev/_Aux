import { TextInput, StyleSheet, TextInputProps, Text, View } from "react-native";
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

type CustomTextInputProps<T extends FieldValues> = {
    control: Control<T>;
    name: Path<T>;// custom fields
} & TextInputProps

export default function CustomTextInput <T extends FieldValues>({control, name, ...props}: CustomTextInputProps<T>) {
    return (
    <Controller 
        control={control} 
        name={name}
        render={({ field: { value, onChange, onBlur }, fieldState: { error },
         }) => (
             <View style={styles.container}>
                <TextInput 
                    {...props} 
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur} 
                    style={[
                        styles.input, 
                        props.style,
                        { borderColor: error ? 'crimson' : 'transparent'},
                    ]}
                    placeholderTextColor="#666"  
                />
                <Text style={styles.error}>{error?.message}</Text>
             </View> 
        )}
      />
    );
};

const styles = StyleSheet.create ({
    container: {
    gap: 1,
    },
    input: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 5,
    backgroundColor: '#333', // Dark background for input
    color: '#fff', // White text
    fontSize: 16,
    },
    error: {
        color: 'crimson',
    },
})