import { ModConstant, UserDefined } from "three.modifiers";
import { VertexProxy } from "three.modifiers/src/core/VertexProxy";

export class PageCurve extends UserDefined {
  intensity = 1;

  constructor(
    public elevationAxis: number = ModConstant.Y,
    public alongAxis: number = ModConstant.X,
    public effectRange: number = 0.5,
    public effectMid: number = 0.5,
    public elevationHeight: number = 0.5
  ) {
    super();
    this.renderVector = this._renderVector;
  }

  private _renderVector(vec: VertexProxy, i: number, l: number) {
    let radio = vec.getRatio(this.alongAxis);
    let val = vec.getValue(this.elevationAxis);

    if (radio <= this.effectRange) {
      radio /= this.effectRange;

      let elevation = 0;

      if (radio < this.effectMid) {
        radio = radio / this.effectMid;
        elevation = Math.sqrt(1 - Math.pow(radio, 2) + radio * 2 - 1);
      } else {
        radio = (radio - this.effectMid) / (1 - this.effectMid);
        elevation = (Math.cos(radio * Math.PI) - -1) / (1 - -1);
      }

      vec.setValue(this.elevationAxis, val + elevation * this.elevationHeight * this.intensity);
    }
  }
}
