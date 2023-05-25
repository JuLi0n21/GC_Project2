import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MapControls } from 'three/addons/controls/MapControls.js';

class TreeNode {
    constructor(value) {
      this.value = value;
      this.children = [];
      this.parent = null;
    }
  
    addChild(node) {
      node.parent = this;
      this.children.push(node);
    }
  
    removeChild(node) {
      const index = this.children.indexOf(node);
      if (index !== -1) {
        this.children.splice(index, 1);
      }
    }
    
    getChild(index) {
      if (index >= 0 && index < this.children.length) {
        return this.children[index];
      }
      return null;
    }
  
    hasChildren() {
      return this.children.length > 0;
    }

    getParent(node) {
        return node.children;
    }
  }
  
  class Tree {
    constructor(rootValue) {
      this.root = new TreeNode(rootValue);
    }
  
    traverseDFS(node, callback) {
      callback(node);
  
      for (const child of node.children) {
        this.traverseDFS(child, callback);
      }
    }
  
    traverseBFS(callback) {
      const queue = [this.root];
  
      while (queue.length > 0) {
        const node = queue.shift();
        callback(node);
  
        for (const child of node.children) {
          queue.push(child);
        }
      }
    }
  
    find(value) {
      let foundNode = null;
  
      this.traverseDFS(this.root, (node) => {
        if (node.value === value) {
          foundNode = node;
        }
      });
  
      return foundNode;
    }
  }
  

class RRT {
  constructor(start, goal, obstacles, maxStepSize) {
    this.start = start;
    this.goal = goal;
    this.obstacles = obstacles;
    this.maxStepSize = maxStepSize;

    this.tree = new Tree(start);
  }

  generateRandomPoint() {
    const x = Math.random() * 500; // Adjust the range based on your problem's domain
    const y = Math.random() * 500; // Adjust the range based on your problem's domain
    return [x, y];
  }

  findNearestNode(point) {
    let nearestNode = null;
    let nearestDistance = Infinity;

    this.tree.traverseDFS(this.tree.root, (node) => {
      const distance = this.calculateDistance(node.value, point);
      if (distance < nearestDistance) {
        nearestNode = node;
        nearestDistance = distance;
      }
    });

    return nearestNode;
  }

  calculateDistance(pointA, pointB) {
    const dx = pointB[0] - pointA[0];
    const dy = pointB[1] - pointA[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  generateNewNode(nearestNode, randomPoint) {
    const distance = this.calculateDistance(nearestNode.value, randomPoint);
    if (distance <= this.maxStepSize) {
      return randomPoint;
    }

    const theta = Math.atan2(
      randomPoint[1] - nearestNode.value[1],
      randomPoint[0] - nearestNode.value[0]
    );
    const newX = nearestNode.value[0] + this.maxStepSize * Math.cos(theta);
    const newY = nearestNode.value[1] + this.maxStepSize * Math.sin(theta);

    return [newX, newY];
  }

  isCollisionFree(point) {
    // Check if the point is in collision with any obstacles
    // You can define your own collision detection logic here
    // For simplicity, let's assume there are no obstacles in this example
    return true;
  }

  expand() {
    const randomPoint = this.generateRandomPoint();
    const nearestNode = this.findNearestNode(randomPoint);
    const newNode = this.generateNewNode(nearestNode, randomPoint);
    console.log(newNode);

    if (this.isCollisionFree(newNode)) {
      const newNodeObj = new TreeNode(newNode);
      nearestNode.addChild(newNodeObj);
      return newNode;
    }

    return null;
  }

  findPath() {
    let path = [];
    let foundGoal = false;

    while (!foundGoal) {
      const newNode = this.expand();
      if (newNode) {
        path.push(newNode);
        
        if (this.calculateDistance(newNode, this.goal) <= this.maxStepSize) {
          path.push(this.goal);
          foundGoal = true;
        }
      }
    }

    return path;
  }
}

function visualizePath(tree, start, end) {
    // Create a scene
    const scene = new THREE.Scene();
  
    // Create a camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(end[0], end[1], 100 );

    //camera.position.z = 100;
  
    // Create a renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
  
    const controls = new MapControls( camera, renderer.domElement );
    console.log(controls)
    controls.screenSpacePanning = false;
    controls.target = new THREE.Vector3( end[0], end[1], 0)
    // Create material for the tree edges
    const treeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  
    // Traverse the tree and render the edges
    tree.traverseDFS(tree.root, (node) => {
      for (const child of node.children) {
        const edgeGeometry = new THREE.BufferGeometry();
        const edgePoints = [
          new THREE.Vector3(node.value[0], node.value[1], 0),
          new THREE.Vector3(child.value[0], child.value[1], 0),
        ];
        edgeGeometry.setFromPoints(edgePoints);
        const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
        scene.add(edgeLine);
      }
    });
  
    // Create geometry and material for the start point
    const startGeometry = new THREE.CircleGeometry(2, 32);
    const startMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
    // Create a mesh for the start point
    const startMesh = new THREE.Mesh(startGeometry, startMaterial);
    startMesh.position.set(start[0], start[1], 0);
  
    // Add the start mesh to the scene
    scene.add(startMesh);
  
    // Create geometry and material for the end point
    const endGeometry = new THREE.CircleGeometry(2, 32);
    const endMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  
    // Create a mesh for the end point
    const endMesh = new THREE.Mesh(endGeometry, endMaterial);
    endMesh.position.set(end[0], end[1], 0);
  
    // Add the end mesh to the scene
    scene.add(endMesh);
  
    // Render the scene
    function render() {
      requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
    }
    render();
  }
  
  
  
  // Define start and goal positions
const start = [10, 10];
const goal = [500, 500];

// Define obstacles (empty for simplicity)
const obstacles = [];

// Define maximum step size
const maxStepSize = 5;

// Create an instance of RRT
const rrt = new RRT(start, goal, obstacles, maxStepSize);

// Find the path
const path = rrt.findPath();

// Print the path
console.log('Path:', path);

visualizePath(rrt.tree,start,goal);