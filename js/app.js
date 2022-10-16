import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// addon
// https://threejs.org/docs/#manual/en/introduction/How-to-use-post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

// 自作のシェーダー （参考：https://threejs.org/examples/jsm/shaders/DotScreenShader.js）
import { DotScreenShader } from './dotEffect.js';
import { RGBShiftShader } from './RGBAEffect.js';

// https://github.com/mattdesl/simple-input-events
const createInputEvents = require('simple-input-events');

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 1, 1000);

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      1,
      1000
    );

    this.event = createInputEvents(this.renderer.domElement);

    // const size = 10;
    // const aspect = wiindow.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera(size * aspect / 2, size * aspect / 2, size / 2, size / 2, -1000, 1000);

    this.camera.position.set(0, 0, 400);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.step = 0;
    this.time = 0;
    this.mouse = new THREE.Vector2();
    this.mouseTarget = new THREE.Vector2();

    this.isPlaying = true;

    this.settings = {
      scale: 3,
      limit: 100,
      amount: 0.0015,
      enabled: false,
      wild: false,
    };

    this.initPost();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.events();
    this.initSettings();
    this.addLights();
  }

  initPost() {
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass)

    this.effectGlitch = new GlitchPass(2);
    this.effectGlitch.goWild = this.settings.wild;
    this.effectGlitch.enabled = this.settings.enabled;
    this.composer.addPass(this.effectGlitch);

    this.effectPass = new ShaderPass(DotScreenShader);
    this.effectPass.uniforms.scale.value = this.settings.scale;
    this.effectPass.uniforms.limit.value = this.settings.limit;
    this.composer.addPass(this.effectPass);

    this.effectPass2 = new ShaderPass(RGBShiftShader);
    this.effectPass2.uniforms.amount.value = this.settings.amount;
    this.composer.addPass(this.effectPass2);
  }

  events() {
    this.event.on('move', ({ uv }) => {
      this.mouse.x = uv[0] - 0.5;
      this.mouse.y = uv[1] - 0.5;
    });
  }

  initSettings() {
    this.gui = new GUI();
    const dot = this.gui.addFolder('Dot');
    dot.add(this.settings, "scale", 0.1, 10, 0.1).onChange(val => {
      this.effectPass.uniforms.scale.value = val;
    });
    dot.add(this.settings, "limit", 0.1, 300, 0.1).onChange(val => {
      this.effectPass.uniforms.limit.value = val;
    });
    dot.add(this.settings, "amount", 0, 0.02, 0.001).onChange(val => {
      this.effectPass2.uniforms.amount.value = val;
    });

    const glitch = this.gui.addFolder('Glitch');
    glitch.add(this.settings, "enabled").onChange(val => {
      this.effectGlitch.enabled = val;
    });
    glitch.add(this.settings, "wild").onChange(val => {
      this.effectGlitch.goWild = val;
    });
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    // マテリアルのテクスチャに画像を反映して、プレーンにはりつける　
    this.object = new THREE.Object3D();

    const geometry = new THREE.SphereGeometry(1, 4, 4);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });

    for (let i = 0; i < 100; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      mesh.position.multiplyScalar(Math.random() * 400);
      mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 50;
      mesh.castShadow = mesh.receiveShadow = true;
      this.object.add(mesh);
    }
    this.scene.add(this.object);
  }

  addLights() {
    const light1 = new THREE.AmbientLight(0x222222);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(1, 1, 1);
    this.scene.add(light2);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    this.object.rotation.x += 0.005;
    this.object.rotation.y += 0.01;

    // this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}

new Sketch({
  dom: document.getElementById('container'),
});