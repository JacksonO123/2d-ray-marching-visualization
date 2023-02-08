import {
  Circle,
  Color,
  distance,
  Point,
  SceneCollection,
  Simulation,
  SimulationElement,
  Vector,
  compare,
  Arc,
  Line,
  Square,
} from 'simulationjs';

const canvas = new Simulation('canvas');
canvas.fitElement();

const circlesCol = new SceneCollection('circles');
canvas.add(circlesCol);

let hasSquares = true;

const numObjects = 24;
const circles = generateCircles(Math.floor(numObjects / 2));
const squares = hasSquares ? generateSquares(Math.floor(numObjects / 2)) : [];
circlesCol.scene = [
  ...(circles as SimulationElement[]),
  ...(squares as SimulationElement[]),
];

squares[0].fill(new Color(255, 0, 0));

const character = new Circle(new Point(0, 0), 12, new Color(0, 0, 0));

const arcs = new SceneCollection('arcs');
canvas.add(arcs);

do {
  setCharacterPosition();
} while (checkCirclesCollide(circlesCol.scene as Circle[], character));
canvas.add(character);
const characterSpeed = 4;

let mousePos = new Point(0, 0);

const line = new Line(
  character.pos.clone(),
  mousePos,
  new Color(150, 150, 150),
  2
);
canvas.add(line);

function setCharacterPosition() {
  character.moveTo(new Point(random(canvas.width), random(canvas.height)));
}

let wDown = false;
let aDown = false;
let sDown = false;
let dDown = false;

const keydownEvents = {
  w: () => (wDown = true),
  a: () => (aDown = true),
  s: () => (sDown = true),
  d: () => (dDown = true),
  ' ': () => setCharacterPosition(),
};

const keyupEvents = {
  w: () => (wDown = false),
  a: () => (aDown = false),
  s: () => (sDown = false),
  d: () => (dDown = false),
};

document.body.addEventListener('keydown', e => {
  const f = keydownEvents[e.key];
  if (f) f();
});

document.body.addEventListener('keyup', e => {
  const f = keyupEvents[e.key];
  if (f) f();
});

canvas.on('mousemove', (e: MouseEvent) => {
  mousePos = new Point(e.offsetX * canvas.ratio, e.offsetY * canvas.ratio);
  line.setEnd(new Vector(mousePos.x, mousePos.y));
});

function distanceFromCircle(p: Point, circle: Circle): number {
  return distance(p, circle.pos) - circle.radius;
}

function CheckAndMove(v: Vector) {
  let collidingWith: Circle | null = null;
  for (let i = 0; i < circlesCol.scene.length; i++) {
    if (
      distance(character.pos.clone().add(v), circlesCol.scene[i].pos) -
        character.radius <
      (circlesCol.scene[i] as Circle).radius
    ) {
      collidingWith = (circlesCol.scene[i] as Circle).clone();
      break;
    }
  }
  if (!collidingWith) {
    character.move(v);
  } else {
    const movementVec = v.clone();
    const fromCircleVec = new Vector(
      character.pos.x - collidingWith.pos.x,
      character.pos.y - collidingWith.pos.y
    )
      .normalize()
      .multiply(characterSpeed);
    const toMove = new Vector(
      movementVec.x + fromCircleVec.x,
      movementVec.y + fromCircleVec.y
    );
    character.move(toMove);
  }
}

function pointIsOut(p: Point): boolean {
  if (p.x < 0 || p.y < 0 || p.x > canvas.width || p.y > canvas.height) {
    return true;
  }
  return false;
}

function getMinDist(p: Point, h = false) {
  let dist = 0;
  for (let i = 0; i < circles.length; i++) {
    const d = distanceFromCircle(p, circles[i]);
    if (i === 0) {
      dist = d;
    } else if (d < dist) {
      dist = d;
    }
  }

  for (let i = 0; i < squares.length; i++) {
    const d = distance(p, rectPoint(p, squares[i], h));
    if (i === 0 && dist === 0) {
      dist = d;
    } else if (d < dist) {
      dist = d;
    }
  }
  return dist;
}

(function gameLoop() {
  if (wDown) {
    CheckAndMove(new Vector(0, -characterSpeed));
  }
  if (aDown) {
    CheckAndMove(new Vector(-characterSpeed, 0));
  }
  if (sDown) {
    CheckAndMove(new Vector(0, characterSpeed));
  }
  if (dDown) {
    CheckAndMove(new Vector(characterSpeed, 0));
  }
  line.setStart(character.pos.clone());
  line.setEnd(new Vector(mousePos.x, mousePos.y));

  arcs.empty();
  let point = character.pos.clone();
  let dist = getMinDist(point, true);
  let rotation = -Math.atan2(
    line.end.y - line.start.y,
    line.end.x - line.start.x
  );
  if (rotation < 0) {
    rotation *= -1;
    rotation = Math.PI * 2 - rotation;
  }
  const arc = new Arc(
    point.clone(),
    Math.max(dist, 1),
    0,
    360,
    4,
    new Color(150, 150, 150)
  );
  arcs.add(arc);
  while (!pointIsOut(point) && dist > 1) {
    point.appendX(Math.cos(rotation) * dist);
    point.appendY(-Math.sin(rotation) * dist);
    dist = getMinDist(point);
    if (dist > 1000) break;
    const arc = new Arc(
      point.clone(),
      Math.max(dist, 1),
      0,
      360,
      4,
      new Color(150, 150, 150)
    );
    arcs.add(arc);
  }

  requestAnimationFrame(gameLoop);
})();

function checkCirclesCollide(circles: Circle[], circle: Circle): boolean {
  for (let i = 0; i < circles.length; i++) {
    if (
      !compare(circles[i], circle) &&
      distance(circle.pos, circles[i].pos) < circles[i].radius + circle.radius
    ) {
      return true;
    }
  }
  return false;
}

function rectPoint(p: Point, b: Square, h = false) {
  const vec = p.clone().sub(new Vector(b.pos.x, b.pos.y));

  vec.setY(Math.min(b.height / 2, vec.y));
  vec.setX(Math.min(b.width / 2, vec.x));

  vec.setY(Math.max(-b.height / 2, vec.y));
  vec.setX(Math.max(-b.width / 2, vec.x));

  vec.appendX(b.pos.x);
  vec.appendY(b.pos.y);
  return vec;
}

function generateSquares(num: number): Square[] {
  let res: Square[] = [];
  const minSize = 36;
  const maxSize = 180;
  for (let i = 0; i < num; i++) {
    let s = new Square(
      new Point(random(canvas.width), random(canvas.height)),
      random(minSize, maxSize),
      random(minSize, maxSize),
      new Color(random(255), random(255), random(255))
    );
    res.push(s);
  }
  return res;
}

function generateCircles(num: number): Circle[] {
  let res: Circle[] = [];
  const minCircleSize = 18;
  const maxCircleSize = 90;
  for (let i = 0; i < num; i++) {
    let c: Circle;
    do {
      c = new Circle(
        new Point(random(canvas.width), random(canvas.height)),
        random(maxCircleSize, minCircleSize),
        new Color(random(255), random(255), random(255))
      );
    } while (checkCirclesCollide(res, c));
    res.push(c);
  }
  return res;
}

function random(range: number, offset?: number): number {
  return (
    Math.floor(Math.random() * (range - (offset ? offset : 0))) +
    (offset ? offset : 0)
  );
}
