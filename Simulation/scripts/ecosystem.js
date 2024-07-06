// Get the canvas element and its context for drawing
const canvas = document.getElementById("ecosystemCanvas");
const ctx = canvas.getContext("2d");
let population = 20;
let foodCount = 50; // Number of food items
const FOV_RADIUS = 50; // Field of View radius
const STARVATION_TIME = 500; // Time in animation frames before an organism dies from starvation (increased)
const REPRODUCTION_CHANCE = 0.03; // Chance for an organism to reproduce when well-fed
const EXTRA_REPRODUCTION_CHANCE = 0.01; // Additional chance for an organism to reproduce two offspring
const REPRODUCTION_COOLDOWN = 600; // Frames required before an organism can reproduce again

// Define the Organism class
class Organism {
  constructor(x, y, radius, maxLastEaten, reproductionCooldown) {
    this.x = x; // X-coordinate
    this.y = y; // Y-coordinate
    this.radius = radius; // Radius of the organism
    this.maxLastEaten = maxLastEaten; // Maximum frames without eating before dying
    this.lastEaten = 0; // Frames since last eating
    this.reproductionCooldown = reproductionCooldown; // Cooldown frames required before reproducing again
    this.reproductionTimer = 0; // Current frames passed since last reproduction
    this.reproductionChance = REPRODUCTION_CHANCE; // Chance to reproduce when well-fed
    this.extraReproductionChance = EXTRA_REPRODUCTION_CHANCE; // Additional chance to reproduce two offspring
    this.canReproduce = false; // Flag indicating if the organism can reproduce
    this.isFull = false; // Flag indicating if the organism is full
    // Random initial velocities for movement
    this.dx = Math.random() * 2 - 1;
    this.dy = Math.random() * 2 - 1;
  }

  // Method to move the organism
  move() {
    // Check for food within FOV and move towards it if not full
    if (!this.isFull) {
      let closestFood = null;
      let closestDistance = FOV_RADIUS;

      foodItems.forEach((food) => {
        const dist = Math.hypot(this.x - food.x, this.y - food.y);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestFood = food;
        }
      });

      // If food is within FOV, move towards it
      if (closestFood) {
        const angle = Math.atan2(
          closestFood.y - this.y,
          closestFood.x - this.x
        );
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
      }
    } else {
      // Move away from food if full
      const closestFood = foodItems.reduce((closest, current) => {
        const dist = Math.hypot(this.x - current.x, this.y - current.y);
        return dist < Math.hypot(this.x - closest.x, this.y - closest.y)
          ? current
          : closest;
      });

      const angle = Math.atan2(this.y - closestFood.y, this.x - closestFood.x);
      this.dx = Math.cos(angle);
      this.dy = Math.sin(angle);
    }

    // Update position
    this.x += this.dx;
    this.y += this.dy;

    // Bounce off the edges of the canvas
    if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
      this.dx = -this.dx;
    }
    if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
      this.dy = -this.dy;
    }

    // Check for food within eating distance and eat it if close enough and not full
    foodItems.forEach((food, index) => {
      const dist = Math.hypot(this.x - food.x, this.y - food.y);
      if (dist < this.radius + food.radius && !this.isFull) {
        this.lastEaten = 0; // Reset starvation timer
        this.isFull = true; // Set organism to full
        foodItems.splice(index, 1); // Remove the eaten food
      }
    });

    // Increment the starvation timer
    this.lastEaten++;

    // Update reproduction cooldown timer
    if (!this.canReproduce) {
      this.reproductionTimer++;
      if (this.reproductionTimer >= this.reproductionCooldown) {
        this.canReproduce = true;
        this.reproductionTimer = 0; // Reset reproduction cooldown timer
      }
    }

    // Check if the organism can reproduce
    if (
      this.lastEaten < this.maxLastEaten / 2 &&
      Math.random() < this.reproductionChance &&
      this.canReproduce
    ) {
      this.reproduce();
      this.canReproduce = false; // Set flag to false until cooldown passes again
    }

    // Organism can start reproducing again when grown
    if (this.radius > 10) {
      this.canReproduce = true;
    }

    // Reduce fullness gradually
    if (this.isFull) {
      this.lastEaten++;
      if (this.lastEaten >= 300) {
        // Simulating time before becoming hungry again
        this.isFull = false;
        this.lastEaten = 0; // Reset starvation timer
      }
    }
  }

  // Method to draw the organism on the canvas
  draw() {
    // Draw FOV
    ctx.beginPath();
    ctx.arc(this.x, this.y, FOV_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 0, 255, 0.3)";
    ctx.stroke();
    ctx.closePath();

    // Calculate color based on starvation level
    const starvationRatio = Math.min(this.lastEaten / this.maxLastEaten, 1);
    const colorValue = Math.floor(255 * (1 - starvationRatio));
    const color = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;

    // Draw organism
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  }

  // Method to check if the organism has starved
  isStarved() {
    return this.lastEaten > this.maxLastEaten;
  }

  // Method to reproduce and create offspring
  reproduce() {
    const newRadius = 5; // Radius of the new organism
    const newX = this.x + (Math.random() * 20 - 10); // Random position near the parent
    const newY = this.y + (Math.random() * 20 - 10); // Random position near the parent

    // Check for extra reproduction chance
    if (Math.random() < this.extraReproductionChance) {
      organisms.push(
        new Organism(
          newX,
          newY,
          newRadius,
          this.maxLastEaten,
          this.reproductionCooldown
        )
      );
    }

    // Always create at least one offspring
    organisms.push(
      new Organism(
        newX,
        newY,
        newRadius,
        this.maxLastEaten,
        this.reproductionCooldown
      )
    );

    this.canReproduce = false; // Set flag to false until cooldown passes again
  }
}

// Define the Food class
class Food {
  constructor(x, y, radius, color) {
    this.x = x; // X-coordinate
    this.y = y; // Y-coordinate
    this.radius = radius; // Radius of the food
    this.color = color; // Color of the food
    this.growthRate = 0.01; // Growth rate of the food
    this.replicationThreshold = 10; // Radius at which food replicates
  }

  // Method to draw the food on the canvas
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }

  // Method to grow the food
  grow() {
    this.radius += this.growthRate;
  }

  // Method to replicate the food
  replicate() {
    if (this.radius >= this.replicationThreshold) {
      // Create a new food item near the current one
      const angle = Math.random() * Math.PI * 2;
      const distance = this.radius * 2;
      const newX = this.x + Math.cos(angle) * distance;
      const newY = this.y + Math.sin(angle) * distance;
      const newRadius = 3; // Starting radius of the new food item
      const newColor = this.color;
      foodItems.push(new Food(newX, newY, newRadius, newColor));

      // Reduce the current food item's size
      this.radius /= 2;
    }
  }
}

// Array to hold all the organisms in the ecosystem
const organisms = [];

// Array to hold all the food in the ecosystem
const foodItems = [];

// Create 20 organisms with random positions
for (let i = 0; i < population; i++) {
  const radius = 5; // Fixed radius for simplicity
  const x = Math.random() * (canvas.width - radius * 2) + radius;
  const y = Math.random() * (canvas.height - radius * 2) + radius;
  const maxLastEaten = STARVATION_TIME; // Max time before starving
  organisms.push(
    new Organism(x, y, radius, maxLastEaten, REPRODUCTION_COOLDOWN)
  );
}

// Create 50 food items with random positions
for (let i = 0; i < foodCount; i++) {
  const radius = 3; // Fixed radius for simplicity
  const x = Math.random() * (canvas.width - radius * 2) + radius;
  const y = Math.random() * (canvas.height - radius * 2) + radius;
  const color = "green"; // Fixed color for simplicity
  foodItems.push(new Food(x, y, radius, color));
}

// Function to animate the ecosystem
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Grow and replicate food items
  foodItems.forEach((food) => {
    food.grow();
    food.replicate();
    food.draw();
  });

  // Move and draw all the organisms
  for (let i = organisms.length - 1; i >= 0; i--) {
    const organism = organisms[i];
    organism.move(); // Update position
    if (organism.isStarved()) {
      organisms.splice(i, 1); // Remove starved organism
    } else {
      organism.draw(); // Draw organism
    }
  }

  requestAnimationFrame(animate); // Loop the animation
}

animate(); // Start the animation
