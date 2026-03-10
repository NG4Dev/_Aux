import { View, Text } from "react-native";
import { Stack, Link } from "expo-router";

const ConfigureWalletPage = () => {
    return (
        <View>
            <Stack.Screen options={{headerTitle: 'Configure wallet'}} />
            <Text>Configure Wallet Page</Text>
            <Link href="/(tabs)/pay/manageWallet">Go to Manage Wallet</Link>
        </View>
    )
}

export default ConfigureWalletPage;
