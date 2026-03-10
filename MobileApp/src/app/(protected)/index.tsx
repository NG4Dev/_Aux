import { View, Text } from "react-native";

export default function HomeScreen() {
    return (
        (<View style={{flex: 1, justifyContent: 'center', alignItems:'center'}}>
            <Text style={{fontSize: 24, fontWeight: 'bold'}}>Home screen</Text>
            <Text style={{fontSize: 24, fontWeight: 'bold'}}>
                Only logged in users can access these screens
            </Text>
        </View>)
    );
}