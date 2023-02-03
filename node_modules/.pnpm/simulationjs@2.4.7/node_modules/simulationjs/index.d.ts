declare module 'simulationjs' {
  declare class Vector {
    x: number;
    y: number;
    mag: number;
    startAngle: number;
    startX: number;
    startY: number;
    rotation: number;
    constructor(x: number, y: number, r?: number);
    rotate: (deg: number) => Vector;
    rotateTo: (deg: number) => Vector;
    draw: (c: CanvasRenderingContext2D, pos?: Point, color?: Color, thickness?: number) => void;
    normalize: () => Vector;
    multiply: (n: number) => Vector;
    add: (p: Point) => Point;
    multiplyX: (n: number) => Vector;
    multiplyY: (n: number) => Vector;
    divide: (n: number) => Vector;
    appendMag: (value: number) => Vector;
    appendX: (value: number) => Vector;
    appendY: (value: number) => Vector;
    setX: (value: number) => Vector;
    setY: (value: number) => Vector;
    setMag: (value: number) => Vector;
    clone: () => Vector;
    format: () => string;
  }

  declare class SimulationElement {
    pos: Point;
    color: Color;
    sim: HTMLCanvasElement | null;
    constructor(pos: Point, color?: Color);
    setSimulationElement: (el: HTMLCanvasElement) => void;
    fill: (color: Color, t?: number) => Promise;
    moveTo: (p: Point, t?: number) => Promise;
    move: (p: Point, t?: number) => Promise;
  }

  declare class Color {
    r: number;
    g: number;
    b: number;
    constructor(r: number, g: number, b: number);
    clone: () => Color;
    toHex: () => string;
  }

  declare class Point extends Vector {
    constructor(x: number, y: number);
    clone: () => Point;
  }

  declare class SceneCollection extends SimulationElement {
    name: string;
    scene: SimulationElement[];
    idObjs: {
      [key: string]: SimulationElement;
    };
    constructor(n?: string);
    add: (element: SimulationElement, id?: string) => void;
    removeWithId: (id: string) => void;
    removeWithObject: (element: SimulationElement) => void;
    setSimulationElement: (sim: HTMLCanvasElement) => void;
    empty: () => void;
    draw: (c: CanvasRenderingContext2D) => void;
  }

  declare class Line extends SimulationElement {
    start: Point;
    end: Point;
    rotation: number;
    thickness: number;
    constructor(p1: Point, p2: Point, color?: Color, thickness?: number, r?: number);
    clone: () => Line;
    setStart: (p: Point, t?: number) => Promise;
    setEnd: (p: Point, t?: number) => Promise;
    rotate: (deg: number, t?: number) => Promise;
    rotateTo: (deg: number, t?: number) => Promise;
    moveTo: (p: Point, t?: number) => Promise;
    move: (v: Vector, t?: number) => Promise;
    draw: (c: CanvasRenderingContext2D) => void;
  }

  declare class Circle extends SimulationElement {
    radius: number;
    hovering: boolean;
    events: string[];
    constructor(pos: Point, radius: number, color?: Color);
    clone: () => Circle;
    draw: (c: CanvasRenderingContext2D) => void;
    setRadius: (value: number, t?: number) => Promise;
    scale: (value: number, t?: number) => Promise;
    on: (event: string, callback1: Function, callback2: Function) => void;
    contains: (p: Point) => boolean;
  }

  declare class Polygon extends SimulationElement {
    rawPoints: Point[];
    offsetPoint: Point;
    offsetX: number;
    offsetY: number;
    points: Point[];
    rotation: number;
    constructor(pos: Point, points: Point[], color: Color, r?: number, offsetPoint?: Point);
    setPoints: (points: Point[]) => void;
    clone: () => Polygon;
    rotate: (deg: number) => void;
    rotateTo: (deg: number) => void;
    draw: (c: CanvasRenderingContext2D) => void;
  }

  declare class Arc extends SimulationElement {
    radius: number;
    startAngle: number;
    endAngle: number;
    counterClockwise: boolean;
    thickness: number;
    rotation: number;
    constructor(
      pos: Point,
      radius: number,
      startAngle: number,
      endAngle: number,
      thickness?: number,
      color?: Color,
      rotation?: number,
      counterClockwise?: boolean
    );
    scaleRadius: (scale: number, t?: number) => Promise;
    setRadius: (scale: number, t?: number) => Promise;
    setThickness: (scale: number, t?: number) => Promise;
    setStartAngle: (scale: number, t?: number) => Promise;
    setEndAngle: (scale: number, t?: number) => Promise;
    rotate: (scale: number, t?: number) => Promise;
    rotateTo: (scale: number, t?: number) => Promise;
    draw: (c: CanvasRenderingContext2D) => void;
  }

  declare class Event {
    name: string;
    callback: string;
    constructor(name: string, callback: Function);
  }

  declare class Square extends SimulationElement {
    width: number;
    height: number;
    rotation: number;
    showNodeVectors: boolean;
    showCollisionVectors: boolean;
    hovering: boolean;
    events: string[];
    constructor(
      pos: Point,
      width: number,
      height: number,
      color: Color,
      offsetPoint?: Point,
      rotation?: number
    );
    updateOffsetPosition: (p: Point) => void;
    setNodeVectors: (show: boolean) => void;
    setCollisionVectors: (show: boolean) => void;
    rotate: (deg: number, t?: number) => Promise;
    rotateTo: (deg: number, t?: number) => Promise;
    draw: (c: CanvasRenderingContext2D) => void;
    scale: (value: number, t?: number) => Promise;
    scaleWidth: (value: number, t?: number) => Promise;
    scaleHeight: (value: number, t?: number) => Promise;
    setWidth: (value: number, t?: number) => Promise;
    setHeight: (value: number, t?: number) => Promise;
    contains: (p: Point) => boolean;
    on: (event: string, callback1: Function, callback2?: Function) => void;
    clone: () => Square;
  }

  declare class Simulation {
    scene: SimulationElement[];
    idObjs: {
      [key: string]: string;
    };
    fitting: boolean;
    bgColor: string;
    canvas: HTMLCanvasElement;
    constructor(id: string, frameRate?: number);
    add: (element: SimulationElement, id?: string) => void;
    removeWithId: (id: string) => void;
    removeWithObject: (element: SimulationElement) => void;
    on: (event: string, callback: Function) => void;
    fitElement: () => void;
    setSize: (x: number, y: number) => void;
    empty: () => void;
    setBgColor: (color: Color) => void;
  }

  declare function abs(num: number): number;

  declare function pythag(x: number, y: number): number;

  declare function distance(p1: Point, p2: Point): number;

  declare function atan2(x: number, y: number): number;

  declare function degToRad(deg: number): number;

  declare function radToDeg(rad: number): number;

  declare function transitionValues(
    callback1: Function,
    callback2: Function,
    callback3: Function,
    t: number
  ): Promise;

  declare function compare(val1: any, val2: any): boolean;
}
