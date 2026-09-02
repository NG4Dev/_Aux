import { View, Text } from "react-native";
import { Stack } from "expo-router";

const DisableWalletPage = () => {
    return (
        <View>
            <Stack.Screen options={{headerTitle: 'Disable Wallet'}} />
            <Text>Disable Wallet Page</Text>
        </View>
    )
}

export default DisableWalletPage;