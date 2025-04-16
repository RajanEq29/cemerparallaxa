import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, ActivityIndicator } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Renderer } from 'expo-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Asset } from 'expo-asset';

export default function HomeScreen(): JSX.Element {
  const modelRef = useRef<THREE.Object3D | null>(null);
  const lastRotation = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const viewRef = useRef(null);

  // Clamp helper
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const rotationY = lastRotation.current.y + dx * 0.003;
        const rotationX = lastRotation.current.x + dy * 0.003;

        // Optional: Clamp X rotation to prevent flipping
        targetRotation.current = {
          x: clamp(rotationX, -Math.PI / 2, Math.PI / 2),
          y: rotationY
        };
      },
      onPanResponderRelease: () => {
        lastRotation.current = { ...targetRotation.current };
      }
    })
  ).current;

  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 5);
    scene.add(directionalLight);

    const asset = Asset.fromModule(require('../assets/yellow.glb'));
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;

    const loader = new GLTFLoader();
    loader.load(
      uri,
      (gltf: { scene: any }) => {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, 0);
        model.scale.set(0.5, 0.5, 0.5);
        modelRef.current = model;
        setLoading(false);

        const animate = () => {
          requestAnimationFrame(animate);

          if (modelRef.current) {
            // Smooth interpolation for rotation
            modelRef.current.rotation.x += (targetRotation.current.x - modelRef.current.rotation.x) * 0.1;
            modelRef.current.rotation.y += (targetRotation.current.y - modelRef.current.rotation.y) * 0.1;
          }

          renderer.render(scene, camera);
          gl.endFrameEXP();
        };
        animate();
      },
      (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`),
      (error) => {
        console.error('GLTFLoader Error:', error);
        setLoading(false);
      }
    );
  };

  return (
    <View style={styles.container} ref={viewRef} {...panResponder.panHandlers}>
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      )}
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
    zIndex: 99,
  },
  glView: {
    width: screenWidth,
    height: screenHeight,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
