<<<<<<< HEAD
import React from "react";
import { StyleSheet, View, Text, Button } from "react-native";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAuth } from "@clerk/clerk-expo";

// The video is imported using your TS alias (@assets)
export default function Index() {
  const { signOut, isSignedIn } = useAuth();

  // This effect runs when component mounts and whenever isSignedIn changes
  React.useEffect(() => {
    // If user is already signed in
    if (isSignedIn) {
      // Skip splash screen, go directly to homepage
      router.push('/homepage');
    }
    // If not signed in, this effect does nothing and user sees splash screen
  }, [isSignedIn]);

  // Only render splash screen content if user is not signed in
  if (isSignedIn) {
    return null; // Return nothing while redirecting
  }

  // Initialize the video player:
  // The callback sets the video to loop, mutes it, and starts playing immediately.
=======
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useVideoPlayer, VideoView } from "expo-video";

export default function AuthSplashScreen() {
>>>>>>> app-routing
  const player = useVideoPlayer(
    require("@assets/videos/welcome-bg-video.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  return (
    <View style={styles.container}>
<<<<<<< HEAD
      {/* Background Video:
          - Fills the container using StyleSheet.absoluteFill.
          - pointerEvents is set to "none" so that any taps won't affect the video or show controls.
          - nativeControls is explicitly disabled.
      */}
=======
>>>>>>> app-routing
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
        contentFit="cover"
        nativeControls={false}
      />

<<<<<<< HEAD
      {/* Your foreground content remains unchanged */}
      <View style={styles.content}>
        {/* Place your logo or any other overlay content here */}
      </View>
=======
      {/* Spacer to push buttons to bottom */}
      <View style={styles.content} />
>>>>>>> app-routing

      <View style={styles.buttonContainer}>
        <CustomButton
          text="Sign in"
          style={styles.purpleButton}
<<<<<<< HEAD
          onPress={() => router.push("/(auth)/sign-in")}
=======
          onPress={() => router.push("/(auth)/selection?mode=signin")}
>>>>>>> app-routing
        />

        <CustomButton
          text="Create account"
          style={styles.greenButton}
<<<<<<< HEAD
          onPress={() => router.push("/(auth)/sign-up")}
=======
          onPress={() => router.push("/(auth)/selection?mode=signup")}
>>>>>>> app-routing
        />

        <CustomButton
          text="Continue as guest"
          style={styles.transparentButton}
<<<<<<< HEAD
          onPress={() => router.push("/homepage")}
=======
          onPress={() => router.replace("/(tabs)/home")}
>>>>>>> app-routing
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
  },
  purpleButton: {
    backgroundColor: "#A881E6",
  },
  greenButton: {
<<<<<<< HEAD
    backgroundColor: "#1D8954",
=======
    backgroundColor: "#1DB954",
>>>>>>> app-routing
  },
  transparentButton: {
    backgroundColor: "transparent",
  },
<<<<<<< HEAD
});

=======
});
>>>>>>> app-routing
