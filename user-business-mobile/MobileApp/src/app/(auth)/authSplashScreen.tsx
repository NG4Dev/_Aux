import { View, Text } from "react-native";

export default function AuthSplashScreen() {
    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems:'center'}}>
            <Text style={{fontSize: 24, fontWeight: 'bold'}}>Auth Splash Screen</Text>
            <Text style={{fontSize: 18}}>
                Please wait while we authenticate you...
            </Text>
        </View>
    );
}
