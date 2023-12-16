M.AutoInit(); // Initialize Materialize

const plateauMaxXY = document.getElementById("plateau-max-xy");
const plateauGrid = document.getElementById("plateau-grid");
const plateauStyles = getComputedStyle(plateauGrid);
const plateau = {};
plateau.height = Number(plateauStyles.getPropertyValue("--plateau-height"));

const buggyWidth = plateauStyles.getPropertyValue("--buggy-width");
const buggyHeight = plateauStyles.getPropertyValue("--buggy-height");

const exploreBtn = document.getElementById("explore-btn");

newStyleElement = `<style id="rover-keyframes"></style>`;
document.head.innerHTML += newStyleElement;

const keyframesElement = document.getElementById("rover-keyframes");

let rover1 = {};
let rover2 = {};

window.addEventListener("load", () => {
  plateauFunction(plateau);

  // Create the rovers
  rover1 = new Rover("rover1");
  rover2 = new Rover("rover2");

  rover1.setInitialPosDir();
  rover2.setInitialPosDir();
});

const plateauFunction = (plat) => {
  if (plateauMaxXY.validity.valid) {
    // obtain x and y from input
    getPlateauXY();
    // set plateau
    setPlateau(plat);
  } else {
    console.log("grid size invalid");
  }
};

const getPlateauXY = () => {
  const maxXY = plateauMaxXY.value.split(/[ ,]+/);
  const minXY = [0, 0];
  plateau.x = maxXY[0] - minXY[0];
  plateau.y = maxXY[1] - minXY[1];
  // console.log(`X:${plateau.x}, Y:${plateau.y}`);
};

const setPlateau = (plat) => {
  setPlateauWidthHeight(plat);
  setPlateauGridLines(plat);
  setUnitLength(plat);
};

const setPlateauWidthHeight = (plat) => {
  const { x, y } = plat;
  if (x <= y) {
    plateauGrid.style.height = `${plateau.height}px`;
    plateau.width = (x / y) * plateau.height;
    plateauGrid.style.width = `${plateau.width}px`;
  } else {
    plateauGrid.style.height = `${(y / x) * plateau.height}px`;
    plateau.width = plateau.height;
    plateauGrid.style.width = `${plateau.width}px`;
  }
};
const setPlateauGridLines = (plat) => {
  const { x, y } = plat;
  plateauGrid.style.backgroundSize = `${100 / x}% ${100 / y}%`;
};
const setUnitLength = (plat) => {
  const { x, y, height, width } = plat;
  if (x <= y) {
    plateau.unitLength = height / y;
  } else {
    plateau.unitLength = width / x;
  }
};

// Rover class creation
class Rover {
  constructor(name) {
    this._name = name;
    this._inputXYD = document.getElementById(`${name}-start-xyd`);
    this._inputInstructions = document.getElementById(`${name}-instructions`);
    this._buggy = document.getElementById(`${name}-buggy`);
    this._outputFinalXYD = document.getElementById(`${name}-finalXYD`);
  }
  get name() {
    return this._name;
  }
  get valuesXYDir() {
    if (this._inputXYD.validity.valid) {
      return this._inputXYD.value.split(/[ ,]+/);
    } else {
      console.log("XYDir input invalid");
    }
  }
  get x() {
    return Number(this.valuesXYDir[0]);
  }
  get y() {
    return Number(this.valuesXYDir[1]);
  }
  get dir() {
    return this.valuesXYDir[2].toUpperCase();
  }
  get buggy() {
    return this._buggy;
  }
  get instructions() {
    if (this._inputInstructions.validity.valid) {
      return this._inputInstructions.value;
    } else {
      keyframesElement.innerHTML = "";
      console.log("Instructions input invalid");
    }
  }
  get rotationAmount() {
    switch (this.dir.toUpperCase()) {
      case "E":
        return "rotate(90deg)";
        break;
      case "S":
        return "rotate(180deg)";
        break;
      case "W":
        return "rotate(270deg)";
        break;
      default:
        return "rotate(0deg)";
    }
  }
  setMaxXYPattern() {
    const pX = `${plateau.x}`;
    const pY = `${plateau.y}`;
    let xPattern = "";
    let yPattern = "";
    const compassPattern = `[NESWnesw]`;

    if (pX < 10) {
      xPattern = `[0-${pX}]`;
    } else {
      xPattern = `[0-9]|1[0-${pX[1]}]`;
    }
    if (pY < 10) {
      yPattern = `[0-${pY}]`;
    } else {
      yPattern = `[0-9]|1[0-${pY[1]}]`;
    }
    let combinedPattern = `^(${xPattern})[ ,](${yPattern})[ ,]${compassPattern}$`;
    this._inputXYD.setAttribute("pattern", `${combinedPattern}`);
  }
  setInitialPosDir() {
    const buggy = this._buggy;
    const unitLength = plateau.unitLength;

    buggy.style.left = `${unitLength * this.x - buggyWidth / 2}px`;
    buggy.style.bottom = `${unitLength * this.y - buggyHeight / 2}px`;

    buggy.style.transform = `${this.rotationAmount}`;
  }

  // Create CSS keyframes for animations
  get keyframes() {
    let moves = [this.rotationAmount]; // initial value for animation
    let keyframesString = "";
    const ins = this.instructions;
    const unitLength = plateau.unitLength;

    for (let i = 0; i < ins.length; i += 1) {
      switch (ins[i].toUpperCase()) {
        case "L":
          moves.push(`rotate(-90deg)`);
          break;
        case "R":
          moves.push(`rotate(90deg)`);
          break;
        case "M":
          moves.push(`translateY(-${unitLength}px)`);
          break;
        default:
      }
    }
    for (let i = 0; i <= ins.length; i += 1) {
      let percentage = ((i * 100) / ins.length).toFixed(1);
      keyframesString += `${percentage}% { transform: `;
      for (let j = 0; j <= i; j += 1) {
        keyframesString += `${moves[j]} `;
      }
      keyframesString += `} `;
    }
    return `@keyframes ${this.name}moves { ${keyframesString}}`;
    // console.log(moves);
  }

  // Calculate coordinates and direction after each move
  newCoords() {
    let originalXYD = [this.x, this.y, this.dir];
    const ins = this.instructions;
    const compass = ["N", "E", "S", "W"];
    const largeNumber = 100; // large number with mod 4 of 0. Prevents negative number for index later
    let newIndex = "";
    let coordsList = [originalXYD];
    let newXYD = [0, 0, 0];
    let currentXYD = coordsList[0];

    for (let i = 0; i < ins.length; i += 1) {
      newXYD = currentXYD.map((x) => x);
      let indexOfDir = compass.findIndex((num) => {
        return num === currentXYD[2];
      });

      switch (ins[i].toUpperCase()) {
        case "L":
          newIndex = (largeNumber + indexOfDir - 1) % compass.length;
          newXYD[2] = compass[newIndex];
          coordsList.push(newXYD);
          break;
        case "R":
          newIndex = (largeNumber + indexOfDir + 1) % compass.length;
          newXYD[2] = compass[newIndex];
          coordsList.push(newXYD);
          break;
        case "M":
          switch (currentXYD[2].toUpperCase()) {
            case "N":
              newXYD[1] = newXYD[1] + 1;
              break;
            case "E":
              newXYD[0] = newXYD[0] + 1;
              break;
            case "S":
              newXYD[1] = newXYD[1] - 1;
              break;
            case "W":
              newXYD[0] = newXYD[0] - 1;
              break;
            default:
          }
          coordsList.push(newXYD);
          break;
        default:
      }
      currentXYD = coordsList[coordsList.length - 1];
    }
    // console.log(coordsList);
    console.log(`${this.name} final coordinates and direction: ${currentXYD}`);
    this._outputFinalXYD.innerHTML = currentXYD.join(", ");
  }
}

const createAnimations = (rover) => {
  addAnimation(rover);
  setAnimationDuration(rover);
  setAnimationDelay(rover);
};

const addAnimation = (rover) => {
  const { name, buggy } = rover;
  buggy.classList.remove(`${name}-animation`);
  setTimeout(() => buggy.classList.add(`${name}-animation`), 100); // setTimeout needed to restart animation
};

const setAnimationDuration = (rover) => {
  const { buggy, instructions } = rover;
  buggy.style.animationDuration = `${instructions.length}s`;
};

const setAnimationDelay = (rover) => {
  const { name, buggy } = rover;
  const delay = 0.2;
  if (name === "rover2") {
    buggy.style.animationDelay = `${rover1.instructions.length + delay}s`;
  } else {
    buggy.style.animationDelay = `${delay}s`;
  }
};

const insertKeyframes = () => {
  keyframesElement.innerHTML = "";
  keyframesElement.innerHTML += `${rover1.keyframes} ${rover2.keyframes}`;
};

exploreBtn.addEventListener("click", (e) => {
  plateauFunction(plateau);

  if (plateauMaxXY.validity.valid) {
    rover1.setMaxXYPattern();
    rover1.setInitialPosDir();
    rover1.newCoords();
    rover2.setMaxXYPattern();
    rover2.setInitialPosDir();
    rover2.newCoords();
    createAnimations(rover1);
    createAnimations(rover2);
    insertKeyframes();
  }
});

plateauMaxXY.addEventListener("change", () => {
  getPlateauXY();
  rover1.setMaxXYPattern();
  rover2.setMaxXYPattern();
});
