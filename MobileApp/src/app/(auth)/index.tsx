import React from "react";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAuth } from "@clerk/clerk-expo";

export default function AuthSplashScreen() {
  const { isSignedIn } = useAuth();

  React.useEffect(() => {
    if (isSignedIn) {
      router.replace("/(tabs)/home");
    }
  }, [isSignedIn]);

  const player = useVideoPlayer(
    require("@assets/videos/welcome-bg-video.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  if (isSignedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.content} />

      <View style={styles.buttonContainer}>
        <CustomButton
          text="Sign in"
          style={styles.purpleButton}
          onPress={() => router.push("/(auth)/selection?mode=signin")}
        />

        <CustomButton
          text="Create account"
          style={styles.greenButton}
          onPress={() => router.push("/(auth)/selection?mode=signup")}
        />

        <CustomButton
          text="Continue as guest"
          style={styles.transparentButton}
          onPress={() => router.replace("/(tabs)/home")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
    paddingBottom: 40,
  },
  purpleButton: {
    backgroundColor: "#A881E6",
  },
  greenButton: {
    backgroundColor: "#1DB954",
  },
  transparentButton: {
    backgroundColor: "transparent",
  },
});