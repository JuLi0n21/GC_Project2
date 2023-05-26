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
    if(!this.obstacles.children) {return true}
    this.obstacles.children.forEach(obj => {obj.position.distanceTo(new THREE.Vector3(point[0],point[1],0)) < this.maxStepSize; return false})
    return true;
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