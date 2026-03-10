import { View, Text } from "react-native";
import { Stack } from "expo-router";

const ManageWalletPage = () => {
    return (
        <View>
            <Stack.Screen options={{headerTitle: 'Manage Wallet'}} />
            <Text>Manage Wallet Page</Text>
        </View>
    )
}

export default ManageWalletPage;