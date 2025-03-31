import React, { useState, useEffect, useRef } from 'react';

import { StyleSheet, View, TouchableWithoutFeedback, Text } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Gyroscope } from 'expo-sensors';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import axios from 'axios';
import * as FileSystem from 'expo-file-system'
import HomeScreen from './model/model';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);
  const gyroX = useSharedValue(0);
  const gyroY = useSharedValue(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [tags, setTags] = useState([]);
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    const subscription = Gyroscope.addListener(({ x, y }) => {
      gyroX.value = x * 50; // Scale for parallax effect
      gyroY.value = y * 50;
    });

    Gyroscope.setUpdateInterval(16); // Update every 16ms (~60fps)

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

  // const handleBackgroundPress = async () => {
  //   if (cameraRef.current) {
  //     try {
  //       const photo = await Promise.race([
  //         cameraRef.current.takePictureAsync({ quality: 0.5 }),
  //         new Promise((_, reject) =>
  //           setTimeout(() => reject(new Error('Timeout: Photo not taken within 2 seconds')), 2000)
  //         ),
  //       ]);
  //       console.log('Captured Image Data:', {
  //         uri: photo.uri,
  //         width: photo.width,
  //         height: photo.height,
  //         base64: photo.base64 ? 'Available (truncated)' : 'Not included',
  //       });
  //       try {
  //         if (!photo.uri) {
  //           alert('Please select an image first!');
  //           return;
  //         }
    
  //         // Check if the file exists
  //         const fileInfo = await FileSystem.getInfoAsync(photo.uri);
  //         if (!fileInfo.exists) {
  //           console.error('File not found at:', photo.uri);
  //           alert('Image file not found! It may have been moved or deleted.');
  //           return;
  //         }
    
          // const API_KEY = 'acc_854438e1b93147e';
          // const API_SECRET = '86efb9625ebd0cd694c788fe00196cab';
  //         const API_KEY='acc_9319906490b55e0';
  //         const API_SECRET='67478c69a7a12d8b3e0f5b0283438c1c';
  //         const authString = `${API_KEY}:${API_SECRET}`;
  //         const auth = 'Basic ' + btoa(authString);
    
  //         const base64ImageData = await FileSystem.readAsStringAsync(photo.uri, {
  //           encoding: FileSystem.EncodingType.Base64,
  //         });
    
  //         const formData = new FormData();
  //         formData.append('image_base64', base64ImageData);
    
  //         const uploadResponse = await axios.post(
  //           'https://api.imagga.com/v2/uploads',
  //           formData,
  //           {
  //             headers: {
  //               Authorization: auth,
  //               'Content-Type': 'multipart/form-data',
  //             },
  //           }
  //         );
    
  //         const uploadId = uploadResponse.data.result.upload_id;
    
  //         const tagsResponse = await axios.get(
  //           `https://api.imagga.com/v2/tags?image_upload_id=${uploadId}`,
  //           {
  //             headers: {
  //               Authorization: auth,
  //             },
  //           }
  //         );
    
  //         const detectedTags = tagsResponse.data.result.tags.slice(0, 5);
  //         setTags(detectedTags);
  //       } catch (error) {
  //         console.error('Analyze image error:', error.response?.data || error.message);
  //         alert('Error analyzing image: ' + (error.response?.data?.status?.text || error.message));
  //       }
       
  //     } catch (error) {
  //       console.error('Error taking picture:', error.message);
  //     }
  //   }
  // };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback >
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.overlay}>
            <Animated.Text style={[styles.overlayText, animatedStyle]}>
            <HomeScreen></HomeScreen>
            </Animated.Text> 
        
            
            {/* <HomeScreen></HomeScreen> */}
          </View>
        </CameraView>
      </TouchableWithoutFeedback>
      {/* <HomeScreen></HomeScreen> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Optional: Add slight background for visibility
  },
  debugText: {
    fontSize: 20,
    color: 'yellow',
    marginTop: 10,
  },
});