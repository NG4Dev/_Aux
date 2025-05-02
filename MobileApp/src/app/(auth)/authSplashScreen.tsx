// import { View, Text } from "react-native";

// export default function AuthSplashScreen() {
//     return (
//         (<View style={{flex: 1, justifyContent: 'center', alignItems:'center'}}>
//             <Text style={{fontSize: 24, fontWeight: 'bold'}}>Home screen</Text>
//             <Text style={{fontSize: 24, fontWeight: 'bold'}}>
//                 Only logged in users can access these screens
//             </Text>
//         </View>)
//     );
// }

{/*

import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import { useVideoPlayer, VideoView } from "expo-video";
import { Link } from "expo-router";

// The video is imported using your TS alias (@assets)
export default function Index() {
  // Initialize the video player:
  // The callback sets the video to loop, mutes it, and starts playing immediately.
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
      {/* Background Video:
          - Fills the container using StyleSheet.absoluteFill.
          - pointerEvents is set to "none" so that any taps won't affect the video or show controls.
          - nativeControls is explicitly disabled.
     
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
        contentFit="cover"
        nativeControls={false}
      />

      <Link href='/(protected)' style={styles.link}>Go to protected screens</Link>

      {/* Your foreground content remains unchanged 
      <View style={styles.content}>
        {/* Place your logo or any other overlay content here
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          text="Sign in"
          style={styles.purpleButton}
          onPress={() => router.push("/(auth)/sign-in")}
        />

        <CustomButton
          text="Create account"
          style={styles.greenButton}
          onPress={() => router.push("/(auth)/sign-up")}
        />

        <CustomButton
          text="Continue as guest"
          style={styles.transparentButton}
          onPress={() => router.push("/home")}
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
  link: {
    color: 'white',
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
    backgroundColor: "#1D8954",
  },
  transparentButton: {
    backgroundColor: "transparent",
  },


    */}