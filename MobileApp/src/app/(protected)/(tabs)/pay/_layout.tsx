import { Stack } from "expo-router"

const PayLayout = () => {
    return(
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen 
            name="index"
            />
        </Stack>
    )
}

export default PayLayout