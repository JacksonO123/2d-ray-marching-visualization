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
} from 'simulationjs';

const canvas = new Simulation('canvas');
canvas.fitElement();

const circles = new SceneCollection('circles');
canvas.add(circles);

const numCircles = 24;
const c = generateCircles(numCircles);
circles.scene = c as SimulationElement[];

const character = new Circle(new Point(0, 0), 12, new Color(0, 0, 0));

const arcs = new SceneCollection('arcs');
canvas.add(arcs);

do {
  setCharacterPosition();
} while (checkCirclesCollide(circles.scene as Circle[], character));
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

// const animationTime = 5;
// (function moveLoop() {
//   const newCircles = generateCircles(numCircles);
//   for (let i = 0; i < numCircles; i++) {
//     circles.scene[i].moveTo(newCircles[i].pos, animationTime);
//     (circles.scene[i] as Circle).setRadius(newCircles[i].radius, animationTime);
//   }
//   setTimeout(() => {
//     moveLoop();
//   }, 1000 * animationTime);
// })();

function setCharacterPosition() {
  character.moveTo(
    new Point(random(canvas.canvas.width), random(canvas.canvas.height))
  );
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

document.body.addEventListener('mousemove', (e: MouseEvent) => {
  mousePos = new Point(e.offsetX, e.offsetY);
  line.setEnd(new Vector(mousePos.x * 2, mousePos.y * 2));
});

function distanceFromCircle(p: Point, circle: Circle): number {
  return distance(p, circle.pos) - circle.radius;
}

function CheckAndMove(v: Vector) {
  let collidingWith: Circle | null = null;
  for (let i = 0; i < circles.scene.length; i++) {
    if (
      distance(character.pos.clone().add(v), circles.scene[i].pos) -
        character.radius <
      (circles.scene[i] as Circle).radius
    ) {
      collidingWith = (circles.scene[i] as Circle).clone();
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

function getCircleDist(p: Point): number {
  let dist = 0;
  for (let i = 0; i < circles.scene.length; i++) {
    const d = distanceFromCircle(p, circles.scene[i] as Circle);
    if (i == 0) {
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
  line.setEnd(new Vector(mousePos.x * 2, mousePos.y * 2));

  arcs.empty();
  let point = character.pos.clone();
  let dist = getCircleDist(point);
  let rotation = -Math.atan2(
    line.end.y - line.start.y,
    line.end.x - line.start.x
  );
  if (rotation < 0) {
    rotation *= -1;
    rotation = Math.PI * 2 - rotation;
  }
  const arc = new Arc(point.clone(), dist, 0, 360, 4, new Color(150, 150, 150));
  arcs.add(arc);
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    point.appendX(Math.cos(rotation) * dist);
    point.appendY(-Math.sin(rotation) * dist);
    dist = getCircleDist(point);
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

function generateCircles(num: number): Circle[] {
  let res: Circle[] = [];
  const minCircleSize = 18;
  const maxCircleSize = 90;
  for (let i = 0; i < num; i++) {
    let c: Circle;
    do {
      c = new Circle(
        new Point(random(canvas.canvas.width), random(canvas.canvas.height)),
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
