// global vars
let fps;
let currentMousePos;
let currentMouseEvent;
const validEvents = ['mousemove', 'click', 'hover', 'mouseover', 'mouseleave'];

export class Vector {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} r - optional
   */
  constructor(x, y, r = 0) {
    this.x = x;
    this.y = y;
    this.mag = pythag(x, y);
    this.startAngle = radToDeg(atan2(y, x));
    this.startX = x;
    this.startY = y;
    this.rotation = r;
    this.#setRotation();
  }
  /**
   * @param {number} deg
   * @returns {Vector}
   */
  rotate(deg) {
    this.rotation += deg;
    this.#setRotation();
    return this;
  }
  /**
   * @param {number} deg
   * @returns {Vector}
   */
  rotateTo(deg) {
    this.rotation = deg;
    this.#setRotation();
    return this;
  }
  #setRotation() {
    this.rotation = minimizeRotation(this.rotation);
    const deg = this.rotation * (Math.PI / 180);
    this.x = this.startX * Math.cos(deg) - this.startY * Math.sin(deg);
    this.y = this.startX * Math.sin(deg) + this.startY * Math.cos(deg);
  }
  /**
   *
   * @param {CanvasRenderingContext2D} c
   * @param {Point} pos - optional
   * @param {Color} color - optional
   * @param {number} thickness - optional
   */
  draw(c, pos = new Point(0, 0), color = new Color(0, 0, 0), thickness = 1) {
    c.beginPath();
    c.strokeStyle = color.toHex();
    c.lineWidth = thickness;
    c.moveTo(pos.x, pos.y);
    c.lineTo(pos.x + this.x, pos.y + this.y);
    c.stroke();
    c.closePath();
  }
  /**
   * @returns {Vector}
   */
  normalize() {
    if (this.mag != 0) {
      this.x /= this.mag;
      this.startX /= this.mag;
      this.y /= this.mag;
      this.startY /= this.mag;
      this.mag = 1;
    }
    return this;
  }
  /**
   * @param {number} n
   * @returns {Vector}
   */
  multiply(n) {
    this.x *= n;
    this.startX *= n;
    this.y *= n;
    this.startY *= n;
    this.mag *= n;
    return this;
  }
  /**
   * @param {Vector} v
   * @returns {Vector}
   */
  add(v) {
    this.x += v.x;
    this.startX += v.x;
    this.y += v.x;
    this.startY += v.x;
    this.#updateMag();
    return this;
  }
  /**
   * @param {number} n
   * @returns {Vector}
   */
  multiplyX(n) {
    this.x *= n;
    this.startX *= n;
    this.#updateMag();
    return this;
  }
  /**
   * @param {number} n
   * @returns {Vector}
   */
  multiplyY(n) {
    this.y *= n;
    this.startY *= n;
    this.#updateMag();
    return this;
  }
  /**
   * @param {number} n
   * @returns {Vector}
   */
  divide(n) {
    this.x /= n;
    this.startX /= n;
    this.y /= n;
    this.startY /= n;
    this.mag /= n;
    return this;
  }
  /**
   * @param {number} value
   * @returns {Vector}
   */
  appendMag(value) {
    if (this.mag != 0) {
      const newMag = this.mag + value;
      this.normalize();
      this.multiply(newMag);
      this.mag = newMag;
    }
    return this;
  }
  /**
   * @param {number} value
   * @returns {Vector}
   */
  appendX(value) {
    this.x += value;
    this.startX += value;
    this.#updateMag();
    return this;
  }
  /**
   * @param {number} value
   * @returns {Vector}
   */
  appendY(value) {
    this.y += value;
    this.startY += value;
    this.#updateMag();
    return this;
  }
  /**
   * @param {number} value
   * @returns {Vector}
   */
  setX(value) {
    this.x = value;
    this.startX = value;
    this.#updateMag();
    return this;
  }
  /**
   * @param {number} value
   * @returns {Vector}
   */
  setY(value) {
    this.y = value;
    this.startY = value;
    this.#updateMag();
    return this;
  }
  #updateMag() {
    this.mag = pythag(this.x, this.y);
  }
  /**
   * @param {number} value
   * @returns {Vector}
   */
  setMag(value) {
    this.normalize();
    this.multiply(value);
    this.mag = value;
    return this;
  }
  /**
   * @returns {Vector}
   */
  clone() {
    return new Vector(this.x, this.y, this.rotation);
  }
  /**
   * @returns {string}
   */
  format() {
    return `(${this.x}, ${this.y})`;
  }
}

export class SimulationElement {
  /**
   * @param {Point} pos
   * @param {Color} color - optional
   */
  constructor(pos, color = new Color(0, 0, 0)) {
    this.pos = pos;
    this.color = color;
    this.sim = null;
  }
  /**
   * @param {HTMLCanvasElement} el
   */
  setSimulationElement(el) {
    this.sim = el;
  }
  /**
   * @param {Color} color
   * @param {Number} t - optional
   * @returns {Promise}
   */
  fill(color, t = 0) {
    const currentColor = new Color(this.color.r, this.color.g, this.color.b);
    const colorClone = color.clone();
    const changeR = (colorClone.r - this.color.r) / (t * fps);
    const changeG = (colorClone.g - this.color.g) / (t * fps);
    const changeB = (colorClone.b - this.color.b) / (t * fps);

    const func = () => {
      this.color = colorClone;
    };

    return transitionValues(
      func,
      () => {
        currentColor.r += changeR;
        currentColor.g += changeG;
        currentColor.b += changeB;
        this.color.r = currentColor.r;
        this.color.g = currentColor.g;
        this.color.b = currentColor.b;
      },
      func,
      t
    );
  }
  /**
   * @param {Point} p
   * @param {Number} t - optional
   * @returns {Promise}
   */
  moveTo(p, t = 0) {
    const changeX = (p.x - this.pos.x) / (t * fps);
    const changeY = (p.y - this.pos.y) / (t * fps);

    return transitionValues(
      () => {
        this.pos = p;
      },
      () => {
        this.pos.x += changeX;
        this.pos.y += changeY;
      },
      () => {
        this.pos.x = p.x;
        this.pos.y = p.y;
      },
      t
    );
  }
  /**
   * @param {Vector} p
   * @param {Number} t - optional
   * @returns {Promise}
   */
  move(p, t = 0) {
    const changeX = p.x / (t * fps);
    const changeY = p.y / (t * fps);
    const startPos = new Point(this.pos.x, this.pos.y);

    return transitionValues(
      () => {
        this.pos.x += p.x;
        this.pos.y += p.y;
      },
      () => {
        this.pos.x += changeX;
        this.pos.y += changeY;
      },
      () => {
        this.pos.x = startPos.x + p.x;
        this.pos.y = startPos.y + p.y;
      },
      t
    );
  }
}

export class Color {
  /**
   * @param {number} r
   * @param {number} g
   * @param {number} b
   */
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  /**
   * @returns {Color}
   */
  clone() {
    return new Color(this.r, this.g, this.b);
  }
  #compToHex(c) {
    const hex = Math.round(c).toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  }
  /**
   * @returns {string}
   */
  toHex() {
    return '#' + this.#compToHex(this.r) + this.#compToHex(this.g) + this.#compToHex(this.b);
  }
}

export class Point extends Vector {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super(x, y);
  }
  /**
   * @returns {Point}
   */
  clone() {
    return new Point(this.x, this.y);
  }
}

// extend SimulationElement so it can be added to the
// Simulation scene
export class SceneCollection extends SimulationElement {
  /**
   * @param {string} name - optional
   */
  constructor(name = '') {
    super(new Point(0, 0));
    this.name = name;
    this.scene = [];
    this.idObjs = {};
  }
  /**
   * @param {SimulationElement} element
   * @param {string} id - optional
   */
  add(element, id = null) {
    if (element instanceof SimulationElement) {
      if (this.sim != null) {
        element.setSimulationElement(this.sim);
      }
      if (id != null) {
        this.idObjs[id] = element;
      } else {
        this.scene.push(element);
      }
    } else {
      console.warn('Invalid Element. Must be an instance of SimElement');
    }
  }
  /**
   * @param {string} id
   */
  removeWithId(id) {
    delete this.idObjs[id];
  }
  /**
   * @param {SimulationElement} element
   */
  removeWithObject(element) {
    for (const el of this.scene) {
      if (el == element) {
        this.scene.splice(this.scene.indexOf(el), 1);
        return;
      }
    }
    for (const key of Object.keys(this.idObjs)) {
      if (this.idObjs[key] == element) {
        delete this.idObjs[key];
        return;
      }
    }
  }
  /**
   * @param {HTMLCanvasElement} sim
   */
  setSimulationElement(sim) {
    this.sim = sim;
    for (const element of this.scene) {
      element.setSimulationElement(sim);
    }
  }
  /**
   * @param {CanvasRenderingContext2D} c
   */
  draw(c) {
    for (const element of this.scene) {
      element.draw(c);
    }
    for (const element of Object.values(this.idObjs)) {
      element.draw(c);
    }
  }
  empty() {
    this.scene = [];
    this.idObjs = {};
  }
}

export class Line extends SimulationElement {
  /**
   * @param {Point} p1
   * @param {Point} p2
   * @param {Color} color - optional
   * @param {number} thickness - optional
   * @param {number} r - optional
   */
  constructor(p1, p2, color = new Color(0, 0, 0), thickness = 1, r = 0) {
    super(p1, color);
    this.start = p1;
    this.end = p2;
    this.rotation = r;
    this.thickness = thickness;
    this.#setVector();
  }
  /**
   * @returns {Line}
   */
  clone() {
    return new Line(this.start, this.end, this.thickness, this.color, this.rotation);
  }
  /**
   * @param {Point} p
   * @param {number} t - optional
   * @returns {Promise}
   */
  setStart(p, t = 0) {
    const xChange = (p.x - this.start.x) / (t * fps);
    const yChange = (p.y - this.start.y) / (t * fps);

    return transitionValues(
      () => {
        this.start = p;
      },
      () => {
        this.start.x += xChange;
        this.start.y += yChange;
      },
      () => {
        this.start = p;
      },
      t
    );
  }
  /**
   * @param {Point} p
   * @param {number} t - optional
   * @returns {Promise}
   */
  setEnd(p, t = 0) {
    const xChange = (p.x - this.end.x) / (t * fps);
    const yChange = (p.y - this.end.y) / (t * fps);

    return transitionValues(
      () => {
        this.end = p;
        this.#setVector();
      },
      () => {
        this.end.x += xChange;
        this.end.y += yChange;
        this.#setVector();
      },
      () => {
        this.end = p;
        this.#setVector();
      },
      t
    );
  }
  #setVector() {
    this.vec = new Vector(this.end.x - this.start.x, this.end.y - this.start.y);
    this.vec.rotateTo(this.rotation);
  }
  /**
   * @param {number} deg
   * @param {number} t - optional
   * @returns {Promise}
   */
  rotate(deg, t = 0) {
    const rotationChange = deg / (t * fps);
    const start = this.rotation;

    return transitionValues(
      () => {
        this.rotation += deg;
        this.vec.rotate(deg);
      },
      () => {
        this.rotation += rotationChange;
        this.vec.rotate(rotationChange);
      },
      () => {
        this.rotation = start + deg;
        this.rotation = minimizeRotation(this.rotation);
      },
      t
    );
  }
  /**
   * @param {number} deg
   * @param {number} t - optional
   * @returns {Promise}
   */
  rotateTo(deg, t = 0) {
    const rotationChange = (deg - this.rotation) / (t * fps);

    return transitionValues(
      () => {
        this.rotation = deg;
        this.vec.rotateTo(deg);
      },
      () => {
        this.rotation += rotationChange;
        this.vec.rotateTo(this.rotation);
      },
      () => {
        this.rotation = deg;
        this.rotation = minimizeRotation(this.rotation);
        this.vec.rotateTo(deg);
      },
      t
    );
  }
  /**
   * @param {Point} p
   * @param {number} t - optional
   * @returns {Promise}
   */
  moveTo(p, t = 0) {
    return this.setStart(p, t);
  }
  /**
   * @param {Vector} v
   * @param {number} t - optional
   * @returns {Promise}
   */
  move(v, t = 0) {
    return this.moveTo(this.start.add(v), t);
  }
  /**
   * @param {CanvasRenderingContext2D} c
   */
  draw(c) {
    this.vec.draw(c, new Point(this.start.x, this.start.y), this.color, this.thickness);
  }
}

export class Circle extends SimulationElement {
  /**
   * @param {Point} pos
   * @param {number} radius
   * @param {Color} color
   */
  constructor(pos, radius, color) {
    super(pos, color);
    this.radius = radius;
    this.hovering = false;
    this.events = [];
  }
  /**
   * @returns {Circle}
   */
  clone() {
    return new Circle(this.pos, this.radius, this.color);
  }
  /**
   * @param {CanvasRenderingContext2D} c
   */
  draw(c) {
    c.beginPath();
    c.fillStyle = this.color.toHex();
    c.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, false);
    c.fill();
    c.closePath();
    this.#checkEvents();
  }
  /**
   * @param {number} value
   * @param {number} t - optional
   * @returns {Promise}
   */
  setRadius(value, t = 0) {
    const radiusChange = (value - this.radius) / (t * fps);

    return transitionValues(
      () => {
        this.radius = value;
      },
      () => {
        this.radius += radiusChange;
      },
      () => {
        this.radius = value;
      },
      t
    );
  }
  /**
   * @param {number} value
   * @param {number} t - optional
   * @returns {Promise}
   */
  scale(value, t = 0) {
    const radiusChange = (this.radius * value - this.radius) / (t * fps);
    const finalValue = this.radius * value;

    return transitionValues(
      () => {
        this.radius = finalValue;
      },
      () => {
        this.radius += radiusChange;
      },
      () => {
        this.radius = finalValue;
      },
      t
    );
  }
  #checkEvents() {
    this.events.forEach((event) => {
      const name = event.name;
      switch (name) {
        case 'mouseover': {
          if (!this.hovering && currentMousePos && this.contains(currentMousePos)) {
            this.hovering = true;
            event.callback(currentMouseEvent);
          }
          break;
        }
        case 'mouseleave': {
          if (this.hovering && currentMousePos && !this.contains(currentMousePos)) {
            this.hovering = false;
            event.callback(currentMouseEvent);
          }
          break;
        }
        default:
          break;
      }
    });
  }
  /**
   * @param {string} event
   * @param {Function} callback
   * @param {Function} callback2
   */
  on(event, callback1, callback2) {
    if (!validEvents.includes(event)) {
      console.warn(`Invalid event: ${event}. Event must be one of ${validEvents.join(', ')}`);
      return;
    }

    // specific events
    if (event === 'mousemove') {
      this.sim.addEventListener('mousemove', (e) => {
        const p = new Point(e.offsetX, e.offsetY);
        if (this.contains(p)) {
          callback1(e);
        }
      });
    } else if (event === 'hover') {
      this.on('mouseover', callback1);
      this.on('mouseleave', callback2);
    } else if (event === 'click') {
      this.sim.addEventListener('click', (e) => {
        const p = new Point(e.clientX, e.clientY);
        if (this.contains(p)) {
          callback1(e);
        }
      });
    } else {
      const newEvent = new Event(event, callback1);
      this.events.push(newEvent);
    }
  }
  /**
   * @param {Point} p
   * @returns {boolean}
   */
  contains(p) {
    return distance(p, this.pos) < this.radius;
  }
}

export class Polygon extends SimulationElement {
  /***
   * @param {Color} color
   * @param {Point[]} points
   * @param {number} r - optional
   * @param {Point} offsetPoint - optional
   */
  constructor(pos, points, color, r = 0, offsetPoint = new Point(0, 0)) {
    super(pos, color);
    this.rawPoints = points;
    this.offsetPoint = offsetPoint;
    this.offsetX = this.offsetPoint.x;
    this.offsetY = this.offsetPoint.y;
    this.points = points.map((p) => {
      return new Point(p.x + this.offsetX, p.y + this.offsetY);
    });
    this.rotation = r;
    this.#setRotation();
  }
  /**
   * @param {Point[]} points
   */
  setPoints(points) {
    this.points = points.map((p) => {
      return new Point(p.x + this.offsetX, p.y + this.offsetY);
    });
  }
  /**
   * @returns {Polygon}
   */
  clone() {
    return new Polygon(this.pos, this.rawPoints, this.color, this.rotation, this.offsetPoint);
  }
  /**
   * @param {number} deg
   */
  rotate(deg) {
    this.rotation += deg;
    this.#setRotation();
  }
  /**
   * @param {number} deg
   */
  rotateTo(deg) {
    this.rotation = deg;
    this.#setRotation();
  }
  #setRotation() {
    this.rotation = minimizeRotation(this.rotation);
    this.points = this.points.map((p) => {
      p.rotateTo(this.rotation);
      return p;
    });
  }
  /**
   * @param {CanvasRenderingContext2D} c
   */
  draw(c) {
    c.beginPath();
    c.fillStyle = this.color.toHex();
    c.moveTo(this.points[0].x + this.pos.x, this.points[0].y + this.pos.y);
    for (let i = 1; i < this.points.length; i++) {
      c.lineTo(this.points[i].x + this.pos.x, this.points[i].y + this.pos.y);
    }
    c.fill();
    c.closePath();
  }
}

export class Event {
  /**
   * @param {string} name
   * @param {Function} callback
   */
  constructor(name, callback) {
    this.name = name;
    this.callback = callback;
  }
}

export class Square extends SimulationElement {
  /**
   * @param {Point} pos
   * @param {number} width
   * @param {number} height
   * @param {Color} color
   * @param {Point} offsetPoint - optional
   * @param {number} rotation - optional
   */
  constructor(pos, width, height, color, offsetPoint = new Point(0, 0), rotation = 0) {
    super(pos, color);
    this.width = width;
    this.height = height;
    this.rotation = rotation;
    this.showNodeVectors = false;
    this.showCollisionVectors = false;
    this.hovering = false;
    this.events = [];
    this.updateOffsetPosition(offsetPoint);
  }
  /**
   * @param {Point} p - new position
   */
  updateOffsetPosition(p) {
    this.offsetX = p.x;
    this.offsetY = p.y;
    this.topLeft = new Vector(-this.width / 2 - this.offsetX, -this.height / 2 - this.offsetY);
    this.topRight = new Vector(this.width / 2 - this.offsetX, -this.height / 2 - this.offsetY);
    this.bottomLeft = new Vector(-this.width / 2 - this.offsetX, this.height / 2 - this.offsetY);
    this.bottomRight = new Vector(this.width / 2 - this.offsetX, this.height / 2 - this.offsetY);
    this.#setRotation();
  }
  /**
   * @param {boolean} show
   */
  setNodeVectors(show) {
    this.showNodeVectors = show;
  }
  /**
   * @param {boolean} show
   */
  setCollisionVectors(show) {
    this.showCollisionVectors = show;
  }
  #setRotation() {
    this.topLeft.rotateTo(this.rotation);
    this.topRight.rotateTo(this.rotation);
    this.bottomLeft.rotateTo(this.rotation);
    this.bottomRight.rotateTo(this.rotation);
  }
  /**
   * @param {number} deg
   * @param {number} t - optional
   * @returns {Promise}
   */
  rotate(deg, t = 0) {
    const startRotation = this.rotation;
    const rotationChange = deg / (t * fps);

    const func = () => {
      this.rotation = startRotation + deg;
      this.rotation = minimizeRotation(this.rotation);
      this.#setRotation();
    };

    return transitionValues(
      func,
      () => {
        this.rotation += rotationChange;
        this.#setRotation();
      },
      func,
      t
    );
  }
  /**
   * @param {number} deg
   * @param {number} t - optional
   * @returns {Promise}
   */
  rotateTo(deg, t = 0) {
    const rotationChange = (deg - this.rotation) / (t * fps);

    const func = () => {
      this.rotation = deg;
      this.rotation = minimizeRotation(this.rotation);
      this.#setRotation();
    };

    return transitionValues(
      func,
      () => {
        this.rotation += rotationChange;
        this.#setRotation();
      },
      func,
      t
    );
  }
  /**
   * @param {CanvasRenderingContext2D} c
   */
  draw(c) {
    c.beginPath();
    c.fillStyle = this.color.toHex();
    c.moveTo(this.pos.x + this.topLeft.x + this.offsetX, this.pos.y + this.topLeft.y + this.offsetY);
    c.lineTo(this.pos.x + this.topRight.x + this.offsetX, this.pos.y + this.topRight.y + this.offsetY);
    c.lineTo(this.pos.x + this.bottomRight.x + this.offsetX, this.pos.y + this.bottomRight.y + this.offsetY);
    c.lineTo(this.pos.x + this.bottomLeft.x + this.offsetX, this.pos.y + this.bottomLeft.y + this.offsetY);
    c.fill();
    c.closePath();

    if (this.showNodeVectors) {
      this.topLeft.draw(c, new Point(this.pos.x + this.offsetX, this.pos.y + this.offsetY));
      this.topRight.draw(c, new Point(this.pos.x + this.offsetX, this.pos.y + this.offsetY));
      this.bottomLeft.draw(c, new Point(this.pos.x + this.offsetX, this.pos.y + this.offsetY));
      this.bottomRight.draw(c, new Point(this.pos.x + this.offsetX, this.pos.y + this.offsetY));
    }

    if (this.showCollisionVectors) {
      const testVecs = [this.v1, this.v2, this.v3, this.v4, this.v5];
      if (testVecs.some((el) => el)) {
        testVecs.forEach((vec) => vec.draw(c, new Point(this.pos.x, this.pos.y), new Color(0, 0, 255)));
      }
    }

    this.#checkEvents();
  }
  /**
   * @param {number} value
   * @param {number} t - optional
   * @returns {Promise}
   */
  scale(value, t = 0) {
    const topRightMag = this.topRight.mag;
    const topLeftMag = this.topLeft.mag;
    const bottomRightMag = this.bottomRight.mag;
    const bottomLeftMag = this.bottomLeft.mag;

    const topRightChange = (topRightMag * value - topRightMag) / (t * fps);
    const topLeftChange = (topLeftMag * value - topLeftMag) / (t * fps);
    const bottomRightChange = (bottomRightMag * value - bottomRightMag) / (t * fps);
    const bottomLeftChange = (bottomLeftMag * value - bottomLeftMag) / (t * fps);

    return transitionValues(
      () => {
        this.topRight.multiply(value);
        this.topLeft.multiply(value);
        this.bottomRight.multiply(value);
        this.bottomLeft.multiply(value);

        this.#updateDimensions();
      },
      () => {
        this.topRight.appendMag(topRightChange);
        this.topLeft.appendMag(topLeftChange);
        this.bottomRight.appendMag(bottomRightChange);
        this.bottomLeft.appendMag(bottomLeftChange);
      },
      () => {
        this.topRight.normalize();
        this.topRight.multiply(topRightMag * value);

        this.topLeft.normalize();
        this.topLeft.multiply(topLeftMag * value);

        this.bottomRight.normalize();
        this.bottomRight.multiply(bottomRightMag * value);

        this.bottomLeft.normalize();
        this.bottomLeft.multiply(bottomLeftMag * value);

        this.#updateDimensions();
      },
      t
    );
  }
  #getInitialStartAndMag() {
    const topRightClone = this.topRight.clone();
    const topLeftClone = this.topLeft.clone();
    const bottomLeftClone = this.bottomLeft.clone();
    const bottomRightClone = this.bottomRight.clone();
    return {
      topRightClone,
      topLeftClone,
      bottomLeftClone,
      bottomRightClone
    };
  }
  /**
   * @param {string} component - x or y component of cloned Vector's magnitude
   */
  #getProcessedStartAndMag(component) {
    const startAndMag = this.#getInitialStartAndMag();
    const mags = Object.keys(startAndMag).reduce((prev, current, index) => {
      let obj = {
        ...prev
      };
      if (component) {
        obj[current.replace('Clone', 'Mag')] = startAndMag[current][component];
      } else {
        obj[current.replace('Clone', 'Mag')] = current.mag;
      }
      return obj;
    }, {});
    return {
      ...startAndMag,
      ...mags
    };
  }
  /**
   * @param {value} value
   * @param {value} t - optional
   * @returns {Promise}
   */
  scaleWidth(value, t = 0) {
    let {
      topRightClone,
      topLeftClone,
      bottomRightClone,
      bottomLeftClone,
      topRightMag,
      topLeftMag,
      bottomRightMag,
      bottomLeftMag
    } = this.#getProcessedStartAndMag('x');
    const topRightChange = (topRightMag * value - topRightMag) / (t * fps);
    const topLeftChange = (topLeftMag * value - topLeftMag) / (t * fps);
    const bottomRightChange = (bottomRightMag * value - bottomRightMag) / (t * fps);
    const bottomLeftChange = (bottomLeftMag * value - bottomLeftMag) / (t * fps);

    return transitionValues(
      () => {
        this.topRight.multiplyX(value);
        this.topLeft.multiplyX(value);
        this.bottomRight.multiplyX(value);
        this.bottomLeft.multiplyX(value);

        this.#updateDimensions();
      },
      () => {
        this.topRight.appendX(topRightChange);
        this.topLeft.appendX(topLeftChange);
        this.bottomRight.appendX(bottomRightChange);
        this.bottomLeft.appendX(bottomLeftChange);
      },
      () => {
        topRightClone.setX(1);
        topRightClone.multiplyX(topRightMag * value);
        this.topRight = topRightClone.clone();

        topLeftClone.setX(1);
        topLeftClone.multiplyX(topLeftMag * value);
        this.topLeft = topLeftClone.clone();

        bottomRightClone.setX(1);
        bottomRightClone.multiplyX(bottomRightMag * value);
        this.bottomRight = bottomRightClone.clone();

        bottomLeftClone.setX(1);
        bottomLeftClone.multiplyX(bottomLeftMag * value);
        this.bottomLeft = bottomLeftClone.clone();

        this.#updateDimensions();
      },
      t
    );
  }
  /**
   *
   * @param {number} value
   * @param {number} t - optional
   * @returns {Promise}
   */
  scaleHeight(value, t = 0) {
    let {
      topRightClone,
      topLeftClone,
      bottomLeftClone,
      bottomRightClone,
      topRightMag,
      topLeftMag,
      bottomRightMag,
      bottomLeftMag
    } = this.#getProcessedStartAndMag('y');
    const topRightChange = (topRightMag * value - topRightMag) / (t * fps);
    const topLeftChange = (topLeftMag * value - topLeftMag) / (t * fps);
    const bottomRightChange = (bottomRightMag * value - bottomRightMag) / (t * fps);
    const bottomLeftChange = (bottomLeftMag * value - bottomLeftMag) / (t * fps);

    return transitionValues(
      () => {
        this.topRight.multiplyY(value);
        this.topLeft.multiplyY(value);
        this.bottomRight.multiplyY(value);
        this.bottomLeft.multiplyY(value);

        this.#updateDimensions();
      },
      () => {
        this.topRight.appendY(topRightChange);
        this.topLeft.appendY(topLeftChange);
        this.bottomRight.appendY(bottomRightChange);
        this.bottomLeft.appendY(bottomLeftChange);
      },
      () => {
        topRightClone.setY(1);
        topRightClone.multiplyY(topRightMag * value);
        this.topRight = topRightClone.clone();

        topLeftClone.setY(1);
        topLeftClone.multiplyY(topLeftMag * value);
        this.topLeft = topLeftClone.clone();

        bottomRightClone.setY(1);
        bottomRightClone.multiplyY(bottomRightMag * value);
        this.bottomRight = bottomRightClone.clone();

        bottomLeftClone.setY(1);
        bottomLeftClone.multiplyY(bottomLeftMag * value);
        this.bottomLeft = bottomLeftClone.clone();

        this.#updateDimensions();
      },
      t
    );
  }
  /**
   * @param {number} value
   * @param {number} t - optional
   * @returns {Promise}
   */
  setWidth(value, t = 0) {
    const scale = value / this.width;
    return this.scaleWidth(scale, t);
  }
  /**
   * @param {number} value
   * @param {number} t - optional
   * @returns {Promise}
   */
  setHeight(value, t = 0) {
    const scale = value / this.height;
    return this.scaleHeight(scale, t);
  }
  /**
   * @param {Point} p
   * @returns {boolean}
   */
  contains(p) {
    const topLeftVector = new Vector(this.topLeft.x, this.topLeft.y);
    topLeftVector.rotateTo(-this.rotation);
    this.v1 = topLeftVector;

    const topRightVector = new Vector(this.topRight.x, this.topRight.y);
    topRightVector.rotateTo(-this.rotation);
    this.v2 = topRightVector;

    const bottomLeftVector = new Vector(this.bottomLeft.x, this.bottomLeft.y);
    bottomLeftVector.rotateTo(-this.rotation);
    this.v3 = bottomLeftVector;

    const bottomRightVector = new Vector(this.bottomRight.x, this.bottomRight.y);
    bottomRightVector.rotateTo(-this.rotation);
    this.v4 = bottomRightVector;

    const cursorVector = new Vector(p.x - this.pos.x - this.offsetX, p.y - this.pos.y - this.offsetY);
    cursorVector.rotateTo(-this.rotation);
    this.v5 = cursorVector;

    if (
      cursorVector.x > bottomLeftVector.x &&
      cursorVector.x < topRightVector.x &&
      cursorVector.y > topLeftVector.y &&
      cursorVector.y < bottomLeftVector.y
    ) {
      return true;
    }
    return false;
  }
  #updateDimensions() {
    this.height = this.topRight.y + this.bottomRight.y;
    this.width = this.topRight.x + this.topLeft.x;
  }
  #checkEvents() {
    this.events.forEach((event) => {
      const name = event.name;
      switch (name) {
        case 'mouseover': {
          if (!this.hovering && currentMousePos && this.contains(currentMousePos)) {
            this.hovering = true;
            event.callback(currentMouseEvent);
          }
          break;
        }
        case 'mouseleave': {
          if (this.hovering && currentMousePos && !this.contains(currentMousePos)) {
            this.hovering = false;
            event.callback(currentMouseEvent);
          }
          break;
        }
        default:
          break;
      }
    });
  }
  /**
   * @param {string} event
   * @param {Function} callback
   * @param {Function} callback2
   */
  on(event, callback1, callback2 = () => {}) {
    if (!validEvents.includes(event)) {
      console.warn(`Invalid event: ${event}. Event must be one of ${validEvents.join(', ')}`);
      return;
    }

    // specific events
    if (event === 'mousemove') {
      this.sim.addEventListener('mousemove', (e) => {
        const p = new Point(e.clientX, e.clientY);
        if (this.contains(p)) {
          callback1(e);
        }
      });
    } else if (event === 'click') {
      this.sim.addEventListener('click', (e) => {
        const p = new Point(e.clientX, e.clientY);
        if (this.contains(p)) {
          callback1(e);
        }
      });
    } else if (event === 'hover') {
      this.on('mouseover', callback1);
      this.on('mouseleave', callback2);
    } else {
      const newEvent = new Event(event, callback1);
      this.events.push(newEvent);
    }
  }
  clone() {
    return new Square(this.pos, this.width, this.height, this.color, this.offsetPoint, rotation);
  }
}

export class Arc extends SimulationElement {
  /**
   * @param {Point} pos
   * @param {number} radius
   * @param {number} startAngle
   * @param {number} endAngle
   * @param {number} thickness - optional
   * @param {Circle} color - optional
   * @param {number} rotation - optional
   * @param {boolean} counterClockwise - optional
   */
  constructor(
    pos,
    radius,
    startAngle,
    endAngle,
    thickness = 1,
    color,
    rotation = 0,
    counterClockwise = false
  ) {
    super(pos, color);
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.counterClockwise = counterClockwise;
    this.thickness = thickness;
    this.rotation = rotation;
  }
  /**
   * @param {number} scale
   * @param {number} t - optional
   * @returns {Promise}
   */
  scaleRadius(scale, t = 0) {
    const initialRadius = this.radius;
    const scaleChange = (this.radius * scale - this.radius) / (t * fps);

    return transitionValues(
      () => {
        this.radius *= scale;
      },
      () => {
        this.radius += scaleChange;
      },
      () => {
        this.radius = initialRadius * scale;
      },
      t
    );
  }
  /**
   * @param {number} radius
   * @param {number} t - optional
   * @returns {Promise}
   */
  setRadius(value, t = 0) {
    const radChange = (value - this.radius) / (t * fps);

    return transitionValues(
      () => {
        this.radius = value;
      },
      () => {
        this.radius += radChange;
      },
      () => {
        this.radius = value;
      },
      t
    );
  }
  /**
   * @param {number} val
   * @param {number} t - optional
   * @returns {Promise}
   */
  setThickness(val, t = 0) {
    const thicknessChange = (val - this.thickness) / (t * fps);

    return transitionValues(
      () => {
        this.thickness = val;
      },
      () => {
        this.thickness += thicknessChange;
      },
      () => {
        this.thickness = val;
      },
      t
    );
  }
  /**
   * @param {number} angle
   * @param {number} t - optional
   * @returns {Promise}
   */
  setStartAngle(angle, t = 0) {
    const angleChange = (angle - this.startAngle) / (t * fps);

    return transitionValues(
      () => {
        this.startAngle = angle;
      },
      () => {
        this.startAngle += angleChange;
      },
      () => {
        this.startAngle = angle;
      },
      t
    );
  }
  /**
   * @param {number} angle
   * @param {number} t - optional
   * @returns {Promise}
   */
  setEndAngle(angle, t = 0) {
    const angleChange = (angle - this.endAngle) / (t * fps);

    return transitionValues(
      () => {
        this.endAngle = angle;
      },
      () => {
        this.endAngle += angleChange;
      },
      () => {
        this.endAngle = angle;
      },
      t
    );
  }
  /**
   * @param {number} amount
   * @param {number} t - optional
   * @returns {Promise}
   */
  rotate(amount, t = 0) {
    const initialRotation = this.rotation;
    const rotationChange = (this.rotation + amount - this.rotation) / (t * fps);

    return transitionValues(
      () => {
        this.rotation += scale;
      },
      () => {
        this.rotation += rotationChange;
      },
      () => {
        this.rotation = initialRotation + amount;
      },
      t
    );
  }
  /**
   * @param {number} deg
   * @param {number} t - optional
   * @returns {Promise}
   */
  rotateTo(deg, t = 0) {
    const rotationChange = (deg - this.rotation) / (t * fps);

    return transitionValues(
      () => {
        this.rotation = deg;
      },
      () => {
        this.rotation += rotationChange;
      },
      () => {
        this.rotation = deg;
      },
      t
    );
  }
  draw(c) {
    c.beginPath();
    c.strokeStyle = this.color.toHex();
    c.lineWidth = this.thickness;
    c.arc(
      this.pos.x,
      this.pos.y,
      this.radius,
      degToRad(this.startAngle + this.rotation),
      degToRad(this.endAngle + this.rotation),
      this.counterClockwise
    );
    c.stroke();
    c.closePath();
  }
}

function getPixelRatio(c) {
  const dpr = window.devicePixelRatio || 1;
  const bsr =
    c.webkitBackingStorePixelRatio ||
    c.mozBackingStorePixelRatio ||
    c.msBackingStorePixelRatio ||
    c.oBackingStorePixelRatio ||
    c.backingStorePixelRatio ||
    1;

  return dpr / bsr;
}

export class Simulation {
  /**
   * @param {string} id - canvas id
   * @param {number} frameRate - optional
   */
  constructor(id, frameRate = 60) {
    fps = frameRate;
    this.scene = [];
    this.idObjs = {};
    this.fitting = false;
    this.bgColor = '#ffffff';

    this.canvas = document.getElementById(id);
    if (!this.canvas) {
      console.warn(`Canvas with id "${id}" not found`);
      return;
    }
    this.canvas.addEventListener('mousemove', (e) => {
      currentMousePos = new Point(e.offsetX, e.offsetY);
      currentMouseEvent = e;
    });

    window.addEventListener('resize', () => this.#resizeCanvas(this.canvas));
    this.#resizeCanvas(this.canvas);

    const ctx = this.canvas.getContext('2d');
    ctx.scale(2, 2);

    this.#render(ctx);
  }
  #render(c) {
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    c.beginPath();
    c.fillStyle = this.bgColor;
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.closePath();

    for (const element of this.scene) {
      element.draw(c);
    }
    Object.values(this.idObjs).forEach((element) => {
      element.draw(c);
    });
    window.requestAnimationFrame(() => this.#render(c));
  }
  /**
   * @param {SimulationElement} element
   * @param {String} id - optional
   */
  add(element, id = null) {
    if (element instanceof SimulationElement) {
      element.setSimulationElement(this.canvas);
      if (id !== null) {
        this.idObjs[id] = element;
      } else {
        this.scene.push(element);
      }
    } else {
      console.warn('Invalid Element. Must be an instance of SimElement');
    }
  }
  /**
   * @param {string} id
   */
  removeWithId(id) {
    if (this.idObjs[id] !== undefined) {
      delete this.idObjs[id];
    }
  }
  /**
   * @param {SimulationElement} element
   */
  removeWithObject(element) {
    for (const el of this.scene) {
      if (compare(el, element)) {
        this.scene.splice(this.scene.indexOf(el), 1);
        return;
      }
    }
    for (const key of Object.keys(this.idObjs)) {
      if (compare(this.idObjs[key], element)) {
        delete this.idObjs[key];
      }
    }
  }
  /**
   * @param {string} event
   * @param {Function} callback
   * @returns
   */
  on(event, callback) {
    if (!this.canvas) return;
    this.canvas.addEventListener(event, callback);
  }
  fitElement() {
    if (!this.canvas) return;
    this.fitting = true;
    this.#resizeCanvas(this.canvas);
  }
  /**
   * @param {number} x
   * @param {number} y
   */
  setSize(x, y) {
    if (!this.canvas) return;
    this.canvas.width = x;
    this.canvas.height = y;
    this.fitting = false;
  }
  /**
   * @param {Color} color
   */
  setBgColor(color) {
    if (color instanceof Color) {
      this.bgColor = color.toHex();
    } else {
      console.warn('Invalid color. Must be an instance of Color object');
    }
  }
  #resizeCanvas(c) {
    const ratio = getPixelRatio(c);
    if (!this.canvas) return;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    if (this.fitting) {
      const width = c.parentElement.clientWidth;
      const height = c.parentElement.clientHeight;
      this.canvas.width = width * ratio;
      this.canvas.height = height * ratio;
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
    }
  }
  empty() {
    this.scene = [];
    this.idObjs = {};
  }
}

/**
 * @param {number} num
 * @returns {number}
 */
export function abs(num) {
  return Math.abs(num);
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function pythag(x, y) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

/***
 * @param {Point} p1
 * @param {Point} p2
 * @returns {number}
 */
export function distance(p1, p2) {
  return pythag(p1.x - p2.x, p1.y - p2.y);
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function atan2(x, y) {
  return Math.atan2(y, x);
}

/**
 * @param {number} deg
 * @returns {number}
 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * @param {number} rad
 * @returns {number}
 */
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

function minimizeRotation(rotation) {
  while (rotation > 360) rotation -= 360;
  return rotation;
}

/**
 * @param {Function} callback1 - called when t is 0
 * @param {Function} callback2 - called every frame until the animation is finished
 * @param {Function} callback3 - called after animation is finished
 * @param {number} t - animation time (seconds)
 * @returns {Promise}
 */
export function transitionValues(callback1, callback2, callback3, t) {
  return new Promise((resolve, reject) => {
    if (t == 0) {
      callback1();
      resolve();
    } else {
      const times = t * fps;
      let looped = 0;
      const step = () => {
        callback2();
        if (looped < times) {
          looped++;
          window.requestAnimationFrame(step);
        } else {
          callback3();
          resolve();
        }
      };
      window.requestAnimationFrame(step);
    }
  });
}

/**
 *
 * @param {any} val1
 * @param {any} val2
 * @returns {boolean}
 */
export function compare(val1, val2) {
  const nullUndefArr = [null, undefined];
  if (nullUndefArr.includes(val1) || nullUndefArr.includes(val2)) {
    if (val1 === val2) return true;
    return false;
  }
  if (typeof val1 !== typeof val2) return false;

  if (Array.isArray(val1)) {
    for (let i = 0; i < val1.length; i++) {
      if (!compare(val1[i], val2[i])) return false;
    }
    return true;
  }

  if (typeof val1 === 'object') {
    const compareForKeys = (keys, obj1, obj2) => {
      for (let i = 0; i < keys.length; i++) {
        if (typeof obj1[keys[i]] !== typeof obj2[keys[i]]) {
          return false;
        }

        if (typeof obj1[keys[i]] === 'object') {
          return compare(obj1[keys[i]], obj2[keys[i]]);
        }

        if (obj1[keys[i]] !== obj2[keys[i]]) {
          return false;
        }
      }
      return true;
    };

    const obj1Keys = Object.keys(val1);
    const obj2Keys = Object.keys(val2);

    const key1Result = compareForKeys(obj1Keys, val1, val2);
    const key2Result = compareForKeys(obj2Keys, val1, val2);

    if (key1Result && key2Result) return true;
    return false;
  }

  return val1 === val2;
}

export default {
  Vector,
  SimulationElement,
  Color,
  Point,
  SceneCollection,
  Line,
  Circle,
  Polygon,
  Square,
  Simulation,
  abs,
  pythag,
  distance,
  atan2,
  degToRad,
  radToDeg,
  transitionValues,
  compare
};
