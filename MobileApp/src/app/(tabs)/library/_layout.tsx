import { Stack } from "expo-router";

export default function LibraryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Library" }} />
      <Stack.Screen name="[collectionId]" />
      <Stack.Screen
        name="search"
        options={{ animation: "fade", presentation: "transparentModal" }}
      />
      <Stack.Screen
        name="create-collection"
        options={{ animation: "fade", presentation: "transparentModal" }}
      />
      <Stack.Screen
        name="location-picker"
        options={{ animation: "fade", presentation: "transparentModal" }}
      />
    </Stack>
  );
}
