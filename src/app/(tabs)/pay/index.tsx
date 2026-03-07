import { View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const Pay = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <Link href="/wallet/configureWallet">Configure wallet page</Link>
      <Link href="/(tabs)/pay/manageWallet">Manage wallet page</Link>
      <Link href="/wallet/disableWallet">Disable wallet page</Link>
    </View>
  )
}

export default Pay
