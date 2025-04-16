import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';  // Using expo-camera here
import * as tf from '@tensorflow/tfjs';
import * as tfReactNative from '@tensorflow/tfjs-react-native';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { cameraWithTensors } from '@tensorflow/tfjs-react-native';
import VideoWithmodelRe from './screens/VideoWithmodelRe';

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTfReady, setIsTfReady] = useState(false);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  const cameraRef = useRef<any>(null);  // cameraWithTensors doesn't use CameraView
  const frameId = useRef<any>(null); // To store the animation frame ID for real-time detection
console.log(predictions)
console.log('------------------->',frameId)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');

        await tf.ready();  // Initialize TensorFlow
        await tf.setBackend('rn-webgl');  // Set TensorFlow backend to WebGL
        console.log('TensorFlow backend set to rn-webgl');

        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);  // Load object detection model
        console.log('Model loaded');
        setIsTfReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    })();
  }, []);

  const handleCameraStream = async (tensor: any) => {
    if (model && tensor) {
      try {
        // Run object detection on the current frame
        const predictions = await model.detect(tensor);
        setPredictions(predictions);
      } catch (error) {
        console.error('Error during detection:', error);
      }
    }
  };

  if (hasPermission === null || !isTfReady || !model) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={styles.loadingText}>Initializing TensorFlow and loading model...</Text>
      </View>
    );
  }

  const CameraWithTensor = cameraWithTensors(CameraView);  // Wrapping the Camera component with tensors stream

  return (
    <View style={styles.container}>
      <CameraWithTensor
        ref={cameraRef}
        style={styles.camera}
        type="back"
        onTensorReady={handleCameraStream}  // Callback to handle real-time tensor data
        cameraTextureHeight={1200}
        cameraTextureWidth={1600}
        resizeHeight={300}
        resizeWidth={300}
        resizeDepth= {3}  // RGB image depth
        onFrame={handleCameraStream} // Continuously process the frames
      />
      <TouchableOpacity onPress={() => Alert.alert("hi rajan singh")} style={styles.captureButton}>
        <Text style={styles.captureText}>Real-Time Detection</Text>
      </TouchableOpacity>

      {predictions.length > 0 && (
        <View style={styles.predictionsBox}>
          <Text style={styles.predictionsTitle}>Predictions:</Text>
          {predictions.map((p, idx) => (
            <Text key={idx} style={styles.predictionText}>
              {`${p.class} (${(p.score * 100).toFixed(2)}%)`}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#00ff00',
    padding: 15,
    borderRadius: 12,
    zIndex: 100,
  },
  captureText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  predictionsBox: {
    marginTop: 10,
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    width: 300,
  },
  predictionsTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  predictionText: {
    color: '#333',
  },
});
