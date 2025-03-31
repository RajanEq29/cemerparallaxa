import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, ActivityIndicator, Image, Text } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Renderer } from 'expo-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Asset } from 'expo-asset';


export default function HomeScreen(): JSX.Element {
  const modelRef = useRef<THREE.Object3D | null>(null);


  const [loading, setLoading] = useState(true);
  const onContextCreate = async (gl: any) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(99, width / height, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new Renderer({ gl });
    // renderer.setSize(width, height);
    // renderer.setClearColor('#ffffff');

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 5);
    scene.add(directionalLight);

    // Load the .glb file
    const asset = Asset.fromModule(require('../assets/yellow.glb'));
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;

    const loader = new GLTFLoader();
    loader.load(
      uri,
      (gltf: { scene: any; }) => {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, 0.5);
        model.scale.set(0.5, 0.5, 0.5);
        modelRef.current = model;
        setLoading(false);
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
          gl.endFrameEXP();
        };
        animate();
      },
      (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`),
      (error) => {console.error('GLTFLoader Error:', error);
        setLoading(false); 
      }
      
    );
  };

  // PanResponder for rotating the object only (position remains fixed)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (modelRef.current) {
        const rotateSpeed = 0.002;
        modelRef.current.rotation.y -= gestureState.dx * rotateSpeed;
        modelRef.current.rotation.x -= gestureState.dy * rotateSpeed;
      }
    },
    onPanResponderRelease: () => {},
  });

  return (
    
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <Text style={styles.noImageText}>No image selected</Text>
            )} */}
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
  image: {
    width: 300,
    height: 300,
    marginBottom: 15,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  noImageText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
});

