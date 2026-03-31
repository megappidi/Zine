import * as THREE from "three";
import { FlipPage } from "./FlipPage";

export type FlipBookConfig = {
  flipDuration: number;
  yBetweenPages: number;
  pageSubdivisions: number;
};

type PageSource = string | THREE.Material | THREE.Texture | null;

const AOTexture = (() => {
  let texture: THREE.Texture;
  return () => {
    if (!texture) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "black");
      gradient.addColorStop(0.1, "white");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      texture = new THREE.CanvasTexture(canvas);
      canvas.remove();
    }
    return texture;
  };
})();

export class FlipBook extends THREE.Mesh implements Iterable<FlipPage> {
  private pages: FlipPage[];
  private pool: FlipPage[];
  private readonly _url2Loader: Map<string, Promise<THREE.Material | null>>;
  private readonly _pageSubdivisions: number;
  private _currentProgress: number;
  private _goalProgress: number;
  private _currentPage: number;
  private readonly _flipDuration: number;
  private _stepSize: number;
  private _flipDirection: number;
  private readonly _ySpacing: number;

  constructor(config: FlipBookConfig | null) {
    super();
    this.pages = [];
    this.pool = [];
    this._url2Loader = new Map();
    this._currentProgress = 0;
    this._goalProgress = 0;
    this._currentPage = 0;
    this._stepSize = 0;
    this._flipDirection = 1;
    this._flipDuration = config?.flipDuration ?? 1;
    this._ySpacing = config?.yBetweenPages ?? 0.001;
    this._pageSubdivisions = config?.pageSubdivisions ?? 20;
    this.currentPage = 0;
  }

  [Symbol.iterator](): Iterator<FlipPage> {
    let index = 0;
    return {
      next: (): IteratorResult<FlipPage> => {
        if (index < this.pages.length) {
          return { value: this.pages[index++], done: false };
        }
        return { value: null as any, done: true };
      },
    };
  }

  setPages(pagesSources: PageSource[]) {
    if (pagesSources.length % 2 !== 0) pagesSources.push("");

    while (this.pages.length) {
      const page = this.pages.pop()!;
      page.reset();
      this.pool.push(page);
      this.remove(page);
    }

    let prom: Promise<any> = Promise.resolve();

    for (let i = 0; i < pagesSources.length; i += 2) {
      const urlA = pagesSources[i];
      const urlB = pagesSources[i + 1];
      let page = this.pool.pop();
      if (!page) page = new FlipPage(this._pageSubdivisions);

      this.add(page);
      page.position.y = -this._ySpacing * this.pages.length;
      this.pages.push(page);
      page.name = `Page#${this.pages.length}`;

      prom = prom.then(this.loadPages(urlA, urlB, page));
    }

    if (this.currentPage > this.pages.length * 2 - 1) {
      this._currentPage = this.pages.length * 2 - 1;
      this._currentProgress = this.pages.length;
    }

    this.flipPages();
  }

  get totalPages() {
    return this.pages.length * 2;
  }

  private loadPages(sourceA: PageSource, sourceB: PageSource, page: FlipPage) {
    return () =>
      Promise.all([this.loadPage(sourceA, 1, page), this.loadPage(sourceB, 0, page)]);
  }

  private loadPage(source: PageSource, side: number, page: FlipPage): Promise<void> {
    if (!source || source === "") {
      page.setPageMaterial(
        new THREE.MeshStandardMaterial({
          color: "white",
          roughness: 0.2,
          aoMapIntensity: 0.7,
          aoMap: side === 1 ? AOTexture() : null,
        }),
        side
      );
      return Promise.resolve();
    }

    if (source instanceof THREE.Material) {
      page.setPageMaterial(source, side);
      return Promise.resolve();
    }

    if (source instanceof THREE.Texture) {
      page.setPageMaterial(this.textureToMaterial(source, side), side);
      return Promise.resolve();
    }

    const url = source as string;

    if (!this._url2Loader.has(url)) {
      this._url2Loader.set(
        url,
        new Promise((resolve) => {
          new THREE.TextureLoader().load(
            url,
            (texture) => resolve(this.textureToMaterial(texture, side)),
            undefined,
            () => resolve(null)
          );
        })
      );
    }

    return this._url2Loader.get(url)!.then((material) => {
      if (material) page.setPageMaterial(material, side);
    });
  }

  private textureToMaterial(texture: THREE.Texture, side: number) {
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 16;
    texture.colorSpace = THREE.SRGBColorSpace;

    return new THREE.MeshStandardMaterial({
      color: "white",
      map: texture,
      roughness: 0.2,
      aoMapIntensity: 0.7,
      aoMap: side === 1 ? AOTexture() : null,
      toneMapped: false,
    });
  }

  get currentPage() {
    return this._currentPage;
  }
  set currentPage(n: number) {
    const goal = Math.ceil(n / 2);
    const distance = goal - this._currentProgress;
    this._stepSize = distance / this._flipDuration;
    this._flipDirection = this._stepSize > 0 ? 1 : -1;
    this._currentPage = Math.ceil(n);
    this._goalProgress = goal;
    this.flipPages();
  }

  get progress() {
    return this._currentProgress;
  }
  set progress(p: number) {
    const oldProgress = this._currentProgress;
    this._currentProgress = Math.max(0, Math.min(p, this.pages.length));
    this._currentPage = Math.floor(this._currentProgress * 2);
    this._stepSize = 0;
    this._flipDirection = this._currentProgress > oldProgress ? 1 : -1;
    this.flipPages();
  }

  public animate(delta: number) {
    if (this._stepSize !== 0) {
      this._currentProgress += this._stepSize * delta;

      if (
        (this._stepSize > 0 && this._currentProgress > this._goalProgress) ||
        (this._stepSize < 0 && this._currentProgress < this._goalProgress)
      ) {
        this._currentProgress = this._goalProgress;
        this._stepSize = 0;
      }

      this.flipPages();
    }
  }

  public nextPage() {
    this.currentPage = Math.min(Math.ceil(this.currentPage / 2) + 1, this.pages.length) * 2;
  }

  public previousPage() {
    this.currentPage = Math.max(Math.ceil(this.currentPage / 2) - 1, 0) * 2;
  }

  private flipPages() {
    const totalPages = this.pages.length;
    const activeProgress = this._currentProgress % 1;
    const activeIndex = Math.floor(this._currentProgress);

    for (let i = 0; i < totalPages; i++) {
      const page = this.pages[i];
      const pageProgress =
        activeIndex < i ? 0 : activeIndex > i ? 1 : activeProgress;

      const yProgress = pageProgress < 0.5 ? 0 : (pageProgress - 0.5) / 0.5;
      const leftPileY = -this._ySpacing * (totalPages - i);
      const rightPileY = -this._ySpacing * i;
      const pageCurveEffectIntensity =
        this._currentProgress < 1
          ? activeProgress
          : this._currentProgress >= totalPages
          ? 0
          : this._currentProgress >= totalPages - 1
          ? 1 - activeProgress
          : 1;

      page.flip(pageProgress, this._flipDirection, pageCurveEffectIntensity);
      page.position.y = rightPileY + yProgress * (leftPileY - rightPileY);
    }

    const offset =
      activeIndex === 0
        ? -0.5 + 0.5 * activeProgress
        : activeIndex === totalPages - 1
        ? 0.5 * activeProgress
        : activeIndex === totalPages
        ? 0.5
        : 0;

    this.position.x = offset * this.scale.x;
  }

  public dispose() {
    while (this.pages.length) {
      const page = this.pages.pop()!;
      this.remove(page);
    }
    while (this.pool.length) {
      this.pool.pop()!.dispose(true);
    }
    this._url2Loader.forEach((m) => m.then((mat) => mat?.dispose()));
    this._url2Loader.clear();
  }
}
