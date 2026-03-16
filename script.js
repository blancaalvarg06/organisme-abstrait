class Particle {
  constructor(x, y, isNew = false) {
    this.position = createVector(x, y);
    this.previousPosition = createVector(x, y); 
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.acceleration = createVector(0, 0);
    
    this.energy = isNew ? 255 : 200;
    this.maxEnergy = 255;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update(socleRadius, coreSize, isRepulsionMode) {
    this.previousPosition = this.position.copy();
    
    if (this.energy > 200) {
      this.energy -= 2;
    }
    
    let noiseForce = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
    this.applyForce(noiseForce);
    
    let center = createVector(width / 2, height / 2);
    
    let toCenter = p5.Vector.sub(center, this.position);
    let distance = toCenter.mag();
    
    if (distance < socleRadius) {
      toCenter.normalize();
      let baseAttractionStrength = 0.03 * (socleRadius / INITIAL_SOCLE_RADIUS);
      
      if (isRepulsionMode) {
        baseAttractionStrength *= -1.5;
      }
      
      if (distance > coreSize * 0.7 && distance < coreSize) {
        let edgeMultiplier = 1.5;
        toCenter.mult(baseAttractionStrength * edgeMultiplier);
      } else {
        toCenter.mult(baseAttractionStrength);
      }
      this.applyForce(toCenter);
      
      if (distance < coreSize && !isRepulsionMode) {
        let dx = center.x - this.position.x;
        let dy = center.y - this.position.y;
        let angle = atan2(dy, dx) / PI * 180;
        
        let speed = this.velocity.mag();
        if (speed > 0) {
          let glitchForce = createVector(cos(angle), sin(angle));
          glitchForce.mult(speed * 0.2);
          this.applyForce(glitchForce);
        }
      }
    }
    
    let mouse = createVector(mouseX, mouseY);
    let mouseDistance = p5.Vector.dist(this.position, mouse);
    
    if (mouseDistance < 180 && mouseDistance > 0) {
      if (isRepulsionMode) {
        let attraction = p5.Vector.sub(mouse, this.position);
        attraction.setMag(5);
        this.applyForce(attraction);
      } else {
        let repulsion = p5.Vector.sub(this.position, mouse);
        repulsion.setMag(5);
        this.applyForce(repulsion);
      }
    }
    
    this.velocity.add(this.acceleration);
    
    this.velocity.limit(3);
    this.velocity.mult(0.95);
    
    this.position.add(this.velocity);
    
    this.acceleration.mult(0);
    
    if (this.position.x < 0 || this.position.x > width || 
        this.position.y < 0 || this.position.y > height) {
      let angle = random(TWO_PI);
      let radius = random(100, socleRadius);
      this.position.x = width / 2 + cos(angle) * radius;
      this.position.y = height / 2 + sin(angle) * radius;
      this.velocity = createVector(random(-1, 1), random(-1, 1));
    }
  }

  display() {
    push();
    let brightness = this.energy;
    stroke(255, 255, 255, brightness);
    strokeWeight(0.2);
    line(
      this.previousPosition.x,
      this.previousPosition.y,
      this.position.x,
      this.position.y
    );
    pop();
  }
}

let particles = [];
let socleRadius = 1500;
const INITIAL_SOCLE_RADIUS = 1500;
const INITIAL_PARTICLES = 5000;
let isRepulsionMode = false;
let showLinks = false;
const LINK_DISTANCE = 100;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  initializeOrganism();
}

function initializeOrganism() {
  particles = [];
  socleRadius = INITIAL_SOCLE_RADIUS;
  
  let centerX = width / 2;
  let centerY = height / 2;
  
  for (let i = 0; i < INITIAL_PARTICLES; i++) {
    let angle = random(TWO_PI);
    let radius = random(50, INITIAL_SOCLE_RADIUS);
    let x = centerX + cos(angle) * radius;
    let y = centerY + sin(angle) * radius;
    particles.push(new Particle(x, y, false));
  }
}

function nourishOrganism() {
  let centerX = width / 2;
  let centerY = height / 2;
  
  for (let i = 0; i < 50; i++) {
    let angle = random(TWO_PI);
    let radius = random(0, 20);
    let x = centerX + cos(angle) * radius;
    let y = centerY + sin(angle) * radius;
    particles.push(new Particle(x, y, true));
  }
  
  socleRadius += 2;
}

function draw() {
  background(0);
  fill(0, 5);
  noStroke();
  rect(0, 0, width, height);
  
  let coreSize = 1200 + sin(frameCount * 0.02) * 100;
  
  // Dessiner les liens si activés (version très optimisée)
  if (showLinks) {
    stroke(255, 255, 255, 80);
    strokeWeight(1);
    
    // Ne vérifier qu'une particule sur 50 pour des performances optimales
    for (let i = 0; i < particles.length; i += 50) {
      for (let j = i + 50; j < min(i + 500, particles.length); j += 50) {
        let distance = p5.Vector.dist(particles[i].position, particles[j].position);
        if (distance < LINK_DISTANCE) {
          let alpha = map(distance, 0, LINK_DISTANCE, 120, 20);
          stroke(255, 255, 255, alpha);
          line(
            particles[i].position.x,
            particles[i].position.y,
            particles[j].position.x,
            particles[j].position.y
          );
        }
      }
    }
  }
  
  for (let particle of particles) {
    particle.update(socleRadius, coreSize, isRepulsionMode);
    particle.display();
  }
}

function keyPressed() {
  if (keyCode === 32) {
    nourishOrganism();
  }
  
  if (key === 'r' || key === 'R') {
    initializeOrganism();
  }
  
  if (key === 'i' || key === 'I') {
    isRepulsionMode = !isRepulsionMode;
    console.log('Mode:', isRepulsionMode ? 'RÉPULSION' : 'ATTRACTION');
  }
  
  if (key === 'l' || key === 'L') {
    showLinks = !showLinks;
    console.log('Liens:', showLinks ? 'ACTIVÉS' : 'DÉSACTIVÉS');
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}