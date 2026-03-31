import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as MODIFIERS from "three.modifiers";
import { PageCurve } from "./modifier/PageCurve";

const flipXUV = (geo: THREE.PlaneGeometry) => {
  const uvAttribute = geo.attributes.uv;
  for (let i = 0; i < uvAttribute.count; i++) {
    const u = uvAttribute.getX(i);
    const v = uvAttribute.getY(i);
    uvAttribute.setXY(i, 1 - u, v);
  }
  return geo;
};

const NOTEXTURE = new THREE.MeshStandardMaterial({ color: "#ffffff" });

export class FlipPage extends THREE.Mesh {
  readonly modifiers: MODIFIERS.ModifierStack;
  readonly bend: MODIFIERS.Bend;
  readonly twist: MODIFIERS.Twist;
  readonly page: THREE.Mesh;
  readonly pageCurve: PageCurve;

  constructor(subdivisions: number = 10) {
    super();

    const plane = new THREE.Mesh(
      mergeGeometries(
        [
          flipXUV(new THREE.PlaneGeometry(1, 1, subdivisions, subdivisions)),
          flipXUV(
            new THREE.PlaneGeometry(1, 1, subdivisions, subdivisions).rotateY(Math.PI)
          ),
        ],
        true
      ),
      [NOTEXTURE, NOTEXTURE]
    );

    plane.castShadow = true;
    plane.receiveShadow = true;
    plane.rotateX(Math.PI / 2);
    plane.position.x = 0.5;
    this.scale.z = -1;
    this.add(plane);
    this.page = plane;

    this.modifiers = new MODIFIERS.ModifierStack(plane);

    this.bend = new MODIFIERS.Bend(0, 0, 0);
    this.bend.constraint = MODIFIERS.ModConstant.LEFT;

    this.twist = new MODIFIERS.Twist(0);
    this.twist.vector = new MODIFIERS.Vector3(2, 0, 0);
    this.twist.center = new MODIFIERS.Vector3(-0.5, 0, 0);

    this.pageCurve = new PageCurve(
      MODIFIERS.ModConstant.Z,
      MODIFIERS.ModConstant.X,
      0.812,
      0.325,
      0.054
    );

    this.modifiers.addModifier(this.pageCurve);
    this.modifiers.addModifier(this.bend);
    this.modifiers.addModifier(this.twist);
  }

  public setPageMaterial(newMaterial: THREE.Material, index: number): void {
    (this.page.material as THREE.Material[])[index] = newMaterial;
  }

  public flip(progress: number, direction: number, pageCurveIntensity: number = 1) {
    this.rotation.z = Math.PI * progress;
    this.bend.force = Math.min(-Math.sin(this.rotation.z) / 2, -0.0001) * direction;
    this.twist.angle = Math.sin(this.rotation.z) / 10;
    this.pageCurve.intensity =
      (-1 + 2 * progress) * (-Math.sin(this.rotation.z) + 1) * pageCurveIntensity;
    this.modifiers.apply();
  }

  public reset() {
    this.setPageMaterial(NOTEXTURE, 0);
    this.setPageMaterial(NOTEXTURE, 1);
  }

  public dispose(materialToo: boolean = false) {
    if (materialToo) {
      const mats = this.page.material as THREE.Material[];
      if (mats[0] !== NOTEXTURE) mats[0].dispose();
      if (mats[1] !== NOTEXTURE) mats[1].dispose();
    }
    this.page.geometry.dispose();
    this.modifiers.destroy();
  }
}
