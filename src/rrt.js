import * as THREE from "three";
import { Tree, TreeNode } from "./tree";

export class RRT {
  constructor(start, goal, obstacles, maxStepSize, maxStepCount, range, canvas) {
    this.start = start;
    this.goal = goal;
    this.obstacles = new THREE.Group;
    this.obstacles.copy(obstacles);
    this.maxStepSize = maxStepSize;
    this.range = range;
    this.canvas = canvas;
    this.maxStepCount = maxStepCount;
    this.count = 0;
    this.goalnode = new TreeNode;

    this.tree = new Tree(start);
  }

  generateRandomPoint() {
    const x =  Math.random() * this.range - this.range/2; // Adjust the range based on your problem's domain
    const y = Math.random() * this.range - this.range/2; // Adjust the range based on your problem's domain
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

   // console.log(point)
    let raycaster = new THREE.Raycaster;
    let returnvalue = true;
    if (!this.obstacles.children) {
      returnvalue = true;
    }
    let rayOrigin = new THREE.Vector3(nearestNode.value[0], nearestNode.value[1], 0)
    let rayDirVec = new THREE.Vector3(point[0], point[1], 0).normalize();
    //console.log(rayOrigin);
    //console.log(rayDirVec)
    raycaster.set(rayOrigin,rayDirVec)
     // console.log(this.obstacles)
    this.obstacles.children.forEach((obj) => {
     //  console.log(obj.geometry)
     // console.log(raycaster.intersectObject(obj))
     if(obj.geometry.type !== "CylinderGeometry") {
       if (raycaster.intersectObject(obj).length > 0) {
       //  console.log("raycast");
         returnvalue = false;
       }

       if (
         this.checkCollision(
           rayOrigin,
           rayDirVec,
           obj.position,
           obj.geometry.parameters.radius
         )
       ) {
        // console.log("math collision");
         returnvalue = false;
       }

       if (
         obj.position.distanceTo(new THREE.Vector3(point[0], point[1], 0)) <
         obj.geometry.parameters.radius
       ) {
       //  console.log("smaller");
         returnvalue = false;
       }
     }
    });

    return returnvalue;
  }
  
  checkCollision(rayOrigin, rayDirection, sphereCenter, sphereRadius) {

    const material = new THREE.LineBasicMaterial({
      color: 0x0000ff
    });
    const ray = new THREE.Ray(rayOrigin, rayDirection)

    let distancevec = new THREE.Vector3;
    ray.closestPointToPoint(sphereCenter, distancevec)

    const raymiddletomiddle = [];
    raymiddletomiddle.push(distancevec, sphereCenter);

    const sublinegeometry = new THREE.BufferGeometry().setFromPoints( raymiddletomiddle );
    
    const subline = new THREE.Line( sublinegeometry, material );

    const raytotest = [];
    raytotest.push( rayOrigin, rayDirection);
    
    const raygeometry = new THREE.BufferGeometry().setFromPoints( raytotest );
    
    const line = new THREE.Line( raygeometry, material );

    //console.log(ray);
    //console.log(distancevec)
    
  return distancevec.length < sphereRadius;
  }

  expand() {
    const randomPoint = this.generateRandomPoint();
    const nearestNode = this.findNearestNode(randomPoint);
    const newNode = this.generateNewNode(nearestNode, randomPoint);

    if (this.isCollisionFree(newNode, nearestNode)) {
      const newNodeObj = new TreeNode(newNode, nearestNode);
      nearestNode.addChild(newNodeObj);
      return newNodeObj;
    }

    return null;
  }

  addNodes(count) {
    for (let i = 0; i < count; i++) {
      const newNode = this.expand();
      if (newNode) {
      }
    }
    this.visualize()
    return false
  }

  findPath() {
    let path = [];
    let foundGoal = false;

    while (!foundGoal && this.maxStepCount > this.count) {
      this.count++;
      const newNode = this.expand();
      if (newNode) {
        path.push(newNode);
        //console.log(newNode.value)
        if (this.calculateDistance(newNode.value, this.goal) <= this.maxStepSize) {
          path.push(this.goal);
          foundGoal = true;
          this.goalnode = newNode;
       //   console.log(newNode)
        }
      }
    }

    return path;
  }

  async visulize() {

          this.obstacles.children.forEach(obj => {
            obj.position.set(obj.position.x , obj.position.z , obj.position.y)
          })
          
    
        this.canvas.rotation.x = (Math.PI/2)
    //ADD A visulisation from the goal node to the root node
    //ALSO add line from last node to goal
    //think about turning this into 3d
    //make a RRT* (path optimization)
    if(this.path !== null) {
    this.findPath();
    }
    // Create material for the tree edges
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
    // this.group.rotateX(Math.PI / 2)

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

  drawGoalPath(goalnode) {
    const points = [];
    while (goalnode.parent != null) {
      points.push(new THREE.Vector3(goalnode.value[0], goalnode.value[1]));
      goalnode = goalnode.parent;
    }
    
    points.push(new THREE.Vector3(this.tree.root.value[0], this.tree.root.value[1]))
    const treeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setFromPoints(points);
    const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
    this.canvas.add(edgeLine);
  }
}
