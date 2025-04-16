import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Alert,
  Platform,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Gyroscope } from 'expo-sensors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';

import axios from 'axios';
import HomeScreen from '../model/model';

export default function VideoWithmodelRe() {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const gyroX = useSharedValue(0);
  const gyroY = useSharedValue(0);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    const subscription = Gyroscope.addListener(({ x, y }) => {
      gyroX.value = x * 50;
      gyroY.value = y * 50;
    });

    Gyroscope.setUpdateInterval(16);

    return () => subscription.remove();
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withSpring(gyroX.value) },
        { translateY: withSpring(gyroY.value) },
      ],
    };
  });

  const handleTap = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await Promise.race([
        cameraRef.current.takePictureAsync({ quality: 0.5 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: Photo not taken')), 2000)
        ),
      ]);

      if (!photo.uri) {
        Alert.alert('Error', 'No photo URI');
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Image file not found!');
        return;
      }

      const base64ImageData = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const API_KEY = 'acc_9319906490b55e0';
      const API_SECRET = '67478c69a7a12d8b3e0f5b0283438c1c';
      const auth = 'Basic ' + btoa(`${API_KEY}:${API_SECRET}`);

      const formData = new FormData();
      formData.append('image_base64', base64ImageData);

      const uploadRes = await axios.post(
        'https://api.imagga.com/v2/uploads',
        formData,
        {
          headers: {
            Authorization: auth,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const uploadId = uploadRes.data.result.upload_id;

      const tagsRes = await axios.get(
        `https://api.imagga.com/v2/tags?image_upload_id=${uploadId}`,
        { headers: { Authorization: auth } }
      );

      const topTags = tagsRes.data.result.tags.slice(0, 5);
      setTags(topTags);
      console.log('Detected tags:', topTags);
    } catch (err) {
      console.error('Capture error:', err.message);
      Alert.alert('Error', err.message);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      {/* 🎥 Background video */}
      <Video
    //    source={require("./assets/videos/bike002.mp4")}
           source={require("../assets/videos/bike002.mp4")}

        // style={StyleSheet.absoluteFill}
        resizeMode="cover"
        isLooping
        shouldPlay
        isMuted
        style={styles.backgroundVideo}
        
      />

      {/* 📸 Hidden camera behind everything */}
      {/* <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        isActive={false} // prevents it from rendering
      /> */}

      {/* 👆 Tap to trigger camera and analyze */}
      <TouchableWithoutFeedback onPress={handleTap}>
        <Animated.View style={[styles.overlay, animatedStyle]}>
          <HomeScreen />
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,  // Makes the video fill the entire screen
    height: '100%',
    width: '100%',
  },
});
