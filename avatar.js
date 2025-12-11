import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';

console.log('Avatar.js v17 loaded - Direct CDN imports');

window.onload = () => {
  // Wait a bit for container to be ready
  setTimeout(loadModel, 100);
};

function loadModel() {
  const container = document.getElementById('avatar-container');
  if (!container) {
    console.error('Avatar container not found!');
    return;
  }
  
  console.log('Loading 3D model...');
  const loader = new GLTFLoader();
  loader.load('46936_autosave.glb',
    (gltf) => {
      setupScene(gltf, container);
    }, 
    undefined,
    (error) => {
      console.error('Error loading model:', error);
    }
  );
}

function setupScene(gltf, container) {
    // Get container dimensions with fallbacks
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;
    
    console.log('Container size:', width, 'x', height);
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height);
    camera.position.set(0.2, 0.5, 1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minDistance = 3;
    controls.minPolarAngle = 1.4;
    controls.maxPolarAngle = 1.4;
    controls.target = new THREE.Vector3(0, 0.75, 0);
    controls.update();

    // Scene setup
    const scene = new THREE.Scene();

    // Lighting setup
    scene.add(new THREE.AmbientLight());

    const spotlight = new THREE.SpotLight(0xffffff, 20, 8, 1);
    spotlight.penumbra = 0.5;
    spotlight.position.set(0, 4, 2);
    spotlight.castShadow = true;
    scene.add(spotlight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(1, 1, 2);
    keyLight.lookAt(new THREE.Vector3());
    scene.add(keyLight);

    // Load avatar
    const avatar = gltf.scene;
    avatar.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(avatar);

    // Create pedestal
    const groundGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 64);
    const groundMaterial = new THREE.MeshStandardMaterial();
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    groundMesh.position.y -= 0.05;
    scene.add(groundMesh);

    // Load animations
    const mixer = new THREE.AnimationMixer(avatar);
    const clips = gltf.animations;
    const waveClip = THREE.AnimationClip.findByName(clips, 'mixamo.com.003');
    const stumbleClip = THREE.AnimationClip.findByName(clips, 'mixamo.com.005');
    const waveAction = mixer.clipAction(waveClip);
    const stumbleAction = mixer.clipAction(stumbleClip);

    let isStumbling = false;
    const raycaster = new THREE.Raycaster();
    container.addEventListener('mousedown', (ev) => {
      const coords = {
        x: (ev.offsetX / container.clientWidth) * 2 - 1,
        y: -(ev.offsetY / container.clientHeight) * 2 + 1
      };

      raycaster.setFromCamera(coords, camera);
      const intersections = raycaster.intersectObject(avatar);
  
      if (intersections.length > 0) {
        if (isStumbling) return;

        isStumbling = true;
        stumbleAction.reset();
        stumbleAction.play();
        waveAction.crossFadeTo(stumbleAction, 0.3);

        setTimeout(() => {
          waveAction.reset();
          waveAction.play();
          stumbleAction.crossFadeTo(waveAction, 1);
          setTimeout(() => isStumbling = false, 1000);
        }, 4000)
      }
    });

    window.addEventListener('resize', () => {
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      mixer.update(clock.getDelta());
      renderer.render(scene, camera);
    }

    animate();
    waveAction.play();
}
