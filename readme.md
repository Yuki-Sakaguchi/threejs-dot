# 影をドットで描画するシェーダーを試してみた
https://yuki-sakaguchi.github.io/threejs-dot/dist/

https://user-images.githubusercontent.com/16290220/196026148-be77c7f4-6c40-4093-af09-905cccc2c502.mov

## 考え方
基本的にはシェーダーは持ってきたものをそのまま使ってる  
よくわからないけど数値をいじるだけで楽しいので、 `uniform` で渡すようにして `gui` から操作するようにすると色々試せそう. 
一つ一つ理解するのも大事だろうけど、動くアイディアをためてそれらを組み合わせたり数値を変えてオリジナリティを出すのが近道かも. 

js側は以下のように設定して使える. 
```
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
```

## メモ
### オブジェクトを複数組み合わせて一つのオブジェクトを作る時
こんな感じでやってて参考になった. 
ランダムで位置とか大きさを調整して配置している  
```
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
```

## 参考
- 公式サイト
  - https://threejs.org/examples/#webgl_postprocessing
  - https://threejs.org/docs/#examples/en/postprocessing/EffectComposer
  
## 作っててできたの

https://user-images.githubusercontent.com/16290220/196026208-a0ff5efd-0b4b-44f2-ab6a-33b4b2a694cb.mov

https://user-images.githubusercontent.com/16290220/196026280-e7038c29-cdcb-4190-aa77-2cb82736deb4.mov

https://user-images.githubusercontent.com/16290220/196026323-9705b49b-b7a3-4d9a-8036-e888710dbfdb.mov

https://user-images.githubusercontent.com/16290220/196026379-45524760-01c4-4238-a05e-49b2bc08fdd6.mov

https://user-images.githubusercontent.com/16290220/196026368-a25ab4c9-3201-4903-9cc4-798d18bbd568.mov

