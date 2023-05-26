import * as THREE from "three";
import { Tree, TreeNode } from "./tree";

export class RRT {
  constructor(start, goal, obstacles, maxStepSize, maxStepCount, range, group) {
    this.start = start;
    this.goal = goal;
    this.obstacles = obstacles;
    console.log(this.obstacles)
    this.maxStepSize = maxStepSize;
    this.range = range;
    this.group = group;
    this.maxStepCount = maxStepCount;
    this.count = 0;

    this.tree = new Tree(start);
  }

  generateRandomPoint() {
    const x = Math.random() * this.range; // Adjust the range based on your problem's domain
    const y = Math.random() * this.range; // Adjust the range based on your problem's domain
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
      
      const nearestVector = new THREE.Vector3(nearestNode.value[0], nearestNode.value[1], 0);
      const randomVector = new THREE.Vector3(randomPoint[0], randomPoint[1], 0);
      
      const newNodeVector = new THREE.Vector3().lerpVectors(nearestVector, randomVector, this.maxStepSize / distance);
      const newNode = [newNodeVector.x, newNodeVector.y];
      
      return newNode;
  }

  isCollisionFree(point) {
    // Check if the point is in collision with any obstacles
    // You can define your own collision detection logic here
    // For simplicity, let's assume there are no obstacles in this example
    //console.log(this.obstacles)
    //console.log(this.obstacles);
    var returnvalue = true;
    if(!this.obstacles.children) {returnvalue =  true}
     //console.log(obj.position.distanceTo(new THREE.Vector3(point[1], point[0], 0)));
      
    this.obstacles.children.forEach(obj => {
     if(obj.position.distanceTo(new THREE.Vector3(point[0],point[1],0)) < this.maxStepSize){
     console.log(point)
      console.log(obj.position.distanceTo(new THREE.Vector3(point[1], point[0], 0)));
      returnvalue =  false
     }; 
      
    });

    return returnvalue;
  }

  expand() {
    const randomPoint = this.generateRandomPoint();
    const nearestNode = this.findNearestNode(randomPoint);
    const newNode = this.generateNewNode(nearestNode, randomPoint);

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

    while (!foundGoal && (this.maxStepCount > this.count)) {
      this.count++;
      const newNode = this.expand();
      console.log(newNode);
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

  visulize(){

    this.findPath();
    // Create material for the tree edges
    const treeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  
    // Traverse the tree and render the edges
    this.tree.traverseDFS(this.tree.root, (node) => {
      for (const child of node.children) {
        const edgeGeometry = new THREE.BufferGeometry();
        const edgePoints = [
          new THREE.Vector3(node.value[0], node.value[1], 0),
          new THREE.Vector3(child.value[0], child.value[1], 0),
        ];
        edgeGeometry.setFromPoints(edgePoints);
        const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
        this.group.add(edgeLine);
      }
    });
    this.group.rotateX(Math.PI / 2)

    const startGeometry = new THREE.CircleGeometry(this.maxStepSize, 32);
    const startMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const startMesh = new THREE.Mesh(startGeometry, startMaterial);
    startMesh.position.set(this.start[0], this.start[1], 0);
    this.group.add(startMesh);
  
    const goalGeometry = new THREE.CircleGeometry(this.maxStepSize, 32);
    const goalMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff,  side: THREE.DoubleSide });
    const goalMesh = new THREE.Mesh(goalGeometry, goalMaterial);
    goalMesh.position.set(this.goal[0], this.goal[1], 0);
    this.group.add(goalMesh);
  
  }

}