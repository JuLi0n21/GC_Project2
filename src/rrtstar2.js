import * as THREE from "three";
import { Tree, TreeNode } from "./tree";

export class RRTStar {
  constructor(start, goal, obstacles, maxStepSize, maxStepCount, range, canvas) {
    this.start = start;
    this.goal = goal;
    this.obstacles = obstacles;
    this.maxStepSize = maxStepSize;
    this.range = range;
    this.canvas = canvas;
    this.maxStepCount = maxStepCount;
    this.count = 0;
    this.goalnode = new TreeNode();

    this.tree = new Tree(start);
  }

  generateRandomPoint() {
    const x = Math.random() * this.range - this.range / 2;
    const y = Math.random() * this.range - this.range / 2;
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

    nearestNode.distance = nearestDistance;

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

    const nearestVector = new THREE.Vector3(
      nearestNode.value[0],
      nearestNode.value[1],
      0
    );
    const randomVector = new THREE.Vector3(randomPoint[0], randomPoint[1], 0);

    const newNodeVector = new THREE.Vector3().lerpVectors(
      nearestVector,
      randomVector,
      this.maxStepSize / distance
    );

    const newNode = [newNodeVector.x, newNodeVector.y];

    return newNode;
  }

  isCollisionFree(point, nearestNode) {
    let raycaster = new THREE.Raycaster();
    let returnValue = true;

    if (!this.obstacles.children) {
      return true;
    }

    let rayOrigin = new THREE.Vector3(
      nearestNode.value[0],
      nearestNode.value[1],
      0
    );
    let rayDirVec = new THREE.Vector3(point[0], point[1], 0).normalize();

    raycaster.set(rayOrigin, rayDirVec);

    this.obstacles.children.forEach((obj) => {
      if (obj.geometry.type !== "CylinderGeometry") {
        if (raycaster.intersectObject(obj).length > 0) {
          returnValue = false;
        }

        if (
          this.checkCollision(
            rayOrigin,
            rayDirVec,
            obj.position,
            obj.geometry.parameters.radius
          )
        ) {
          returnValue = false;
        }

        if (
          obj.position.distanceTo(new THREE.Vector3(point[0], point[1], 0)) <
          obj.geometry.parameters.radius
        ) {
          returnValue = false;
        }
      }
    });

    return returnValue;
  }

  checkCollision(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
    const ray = new THREE.Ray(rayOrigin, rayDirection);
    let distanceVec = new THREE.Vector3();
    ray.closestPointToPoint(sphereCenter, distanceVec);

    return distanceVec.length() < sphereRadius;
  }

  expand() {
    const randomPoint = this.generateRandomPoint();
    const nearestNode = this.findNearestNode(randomPoint);
    const newNode = this.generateNewNode(nearestNode, randomPoint);

    if (this.isCollisionFree(newNode, nearestNode)) {
      const newNodeObj = new TreeNode(newNode, nearestNode);
      nearestNode.addChild(newNodeObj);

      let distance = 0;
      let helperNode = newNodeObj;

      while (helperNode.parent !== null) {
        distance += this.calculateDistance(
          helperNode.value,
          helperNode.parent.value
        );
        helperNode = helperNode.parent;
      }

      newNodeObj.distance = distance;

      const nearbyNodes = this.findNearbyNodes(newNodeObj, this.maxStepSize * 3);
      this.rewire(newNodeObj, nearbyNodes);

      return newNodeObj;
    }

    return null;
  }

  findNearbyNodes(newNode, radius) {
    const nearbyNodes = [];

    this.tree.traverseDFS(this.tree.root, (node) => {
      const distance = this.calculateDistance(node.value, newNode.value);
      if (distance <= radius) {
        nearbyNodes.push(node);
      }
    });

    return nearbyNodes;
  }

  calculateTotalDistance(node) {
    let totalDistance = 0;
    let currentNode = node;

    while (currentNode.parent !== null) {
      totalDistance += this.calculateDistance(
        currentNode.value,
        currentNode.parent.value
      );
      currentNode = currentNode.parent;
    }

    return totalDistance;
  }

  rewire(newNode) {
    const totalDistance = this.calculateTotalDistance(newNode);

    if (totalDistance < newNode.distance) {
      newNode.parent.removeChild(newNode);
      newNode.distance = totalDistance;
      this.updateDistanceRecursive(newNode.parent);
      newNode.parent = null;
      this.tree.root = newNode;
      this.rewireRecursive(newNode);
    }
  }

  updateDistanceRecursive(node) {
    let distance = 0;
    let helperNode = node;

    while (helperNode.parent !== null) {
      distance += this.calculateDistance(
        helperNode.value,
        helperNode.parent.value
      );
      helperNode = helperNode.parent;
    }

    node.distance = distance;

    for (const child of node.children) {
      this.updateDistanceRecursive(child);
    }
  }

  rewireRecursive(node) {
    for (const child of node.children) {
      const totalDistance =
        node.distance + this.calculateDistance(node.value, child.value);

      if (totalDistance < child.distance) {
        child.parent.removeChild(child);
        child.parent = node;
        child.distance = totalDistance;
        node.addChild(child);
        this.rewireRecursive(child);
      }
    }
  }

  findPath() {
    let path = [];
    let foundGoal = false;

    while (!foundGoal && this.maxStepCount > this.count) {
      this.count++;
      const newNode = this.expand();

      if (newNode) {
        path.push(newNode);

        if (
          this.calculateDistance(newNode.value, this.goal) <=
          this.maxStepSize
        ) {
          path.push(this.goal);
          foundGoal = true;
          this.goalnode = newNode;
        }
      }
    }

    return path;
  }

  visualize() {
    this.obstacles.children.forEach((obj) => {
      obj.position.set(obj.position.x, obj.position.z, obj.position.y);
    });

    this.canvas.rotation.x = Math.PI / 2;

    this.findPath();

    const treeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    this.tree.traverseDFS(this.tree.root, (node) => {
      for (const child of node.children) {
        const edgeGeometry = new THREE.BufferGeometry();
        const edgePoints = [
          new THREE.Vector3(node.value[0], node.value[1], 0.01),
          new THREE.Vector3(child.value[0], child.value[1], 0.01),
        ];
        edgeGeometry.setFromPoints(edgePoints);
        const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
        this.canvas.add(edgeLine);
      }
    });

    const startGeometry = new THREE.CircleGeometry(0.1, 32);
    const startMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const startMesh = new THREE.Mesh(startGeometry, startMaterial);
    startMesh.position.set(this.start[0], this.start[1], 0);
    this.canvas.add(startMesh);

    const goalGeometry = new THREE.CircleGeometry(this.maxStepSize, 32);
    const goalMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const goalMesh = new THREE.Mesh(goalGeometry, goalMaterial);
    goalMesh.position.set(this.goal[0], this.goal[1], 0);
    this.canvas.add(goalMesh);

    this.drawGoalPath(this.goalnode);
  }

  drawGoalPath(goalNode) {
    const points = [];

    while (goalNode.parent !== null) {
      points.push(new THREE.Vector3(goalNode.value[0], goalNode.value[1]));
      goalNode = goalNode.parent;
    }

    const treeMaterial = new THREE.LineBasicMaterial({ color: 0xff0ff0 });
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setFromPoints(points);
    const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
    this.canvas.add(edgeLine);
  }
}
