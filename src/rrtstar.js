import * as THREE from "three";
import { Tree, TreeNode } from "./tree";

/*
create newNode -> search nearest node -> check for coolsions -> set it as parent 
-> get distance from the combined length of the parent nodes 
-> rewire check if nodes in range have shorter length -> check for collisions form new path

*/

let rewriecoutner = 0;

export class RRTStar {
  constructor(start, goal, obstacles, maxStepSize, maxStepCount, range, canvas) {
    this.start = start
    this.goal = goal;
    this.obstacles = new THREE.Group;
    this.obstacles.copy(obstacles);
    this.maxStepSize = maxStepSize;
    this.range = range;
    this.canvas = canvas;
    this.maxStepCount = maxStepCount;
    this.count = 0;
    this.goalnode = new TreeNode( [ goal[0], goal[1] ]);

    this.tree = new Tree(  [ start[0], start[1] ] );
    
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

    const newNode =[newNodeVector.x, newNodeVector.y];

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

    if (this.isCollisionFree(newNode, nearestNode) === true) {
      const newNodeObj = new TreeNode(newNode, nearestNode);
      nearestNode.addChild(newNodeObj);

      
      newNodeObj.totalDistance = this.calculateTotalDistance(newNodeObj);
      newNodeObj.distanceToParent = newNodeObj.distanceTo(newNodeObj.parent)
      
      this.tree.size++;
      console.log("tree size: ",this.tree.size)
       this.rewireAllNodes();

      return newNodeObj;
    }
  
    return null;
  }
 
  rewireAllNodes() {
    this.tree.traverseDFS(this.tree.root, (node) => {
    //  console.log(node.id)
      let shortestDistance = node.totalDistance;
      let closestNode = null;
      const nearbyNodes = this.findNearbyNodes(node, this.maxStepSize * 5);
  
      
      nearbyNodes.forEach((nearby) => {
        const distance = nearby.totalDistance + nearby.distanceTo(node);
  
        if (distance < shortestDistance && !this.createsCycle(node, nearby) && !this.closestPointToCircle(nearby, node)) {
          //console.log(nearby.id)
          shortestDistance = nearby.totalDistance + nearby.distanceTo(node);
          closestNode = nearby;
        }
      });
  
      if (closestNode) {
        node.parent.removeChild(node);
        node.parent = closestNode;
        closestNode.addChild(node);
        closestNode = null;
      }
    });
  }
  
  isCyclic(node, target) {
    const visited = new Set();
    console.log("überprüfe:", node.id);
    const dfs = (current) => {
      if (visited.has(current)) {
        console.warn("cycle")
        return false; 
      }
  
      if (current === target) {
        return true;
      }
  
      visited.add(current);
  
      for (const child of current.children) {
        if (dfs(child)) {
          return true;
        }
      }
  
      return false;
    };
  
    return dfs(node);
  }
  
  createsCycle(node, potentialParent) {
    const visited = new Set();
    
    const dfs = (current) => {
      if (visited.has(current)) {
        return false; // Cycle detected
      }
  
      if (current === potentialParent) {
        return true; // Found the potential parent, creating a cycle
      }
  
      visited.add(current);
  
      for (const child of current.children) {
        if (dfs(child)) {
          return true; // Cycle detected
        }
      }
  
      return false;
    };
  
    return dfs(node);
  }
  

  closestPointToCircle(originnode, goalnode) {
    let x1 = originnode.value[0];
    let y1 = originnode.value[1];
    let x2 = goalnode.value[0];
    let y2 = goalnode.value[1];
    
    let returnvalue = false;
  
    this.obstacles.children.forEach((obj) => {

      if(obj.geometry.type !== "CylinderGeometry") {
      let cx = obj.position.x;
      let cy = obj.position.y;
      //console.log(obj.geometry.type)
      let r = obj.geometry.parameters.radius + 0.02;
      
      const dx = x2 - x1;
      const dy = y2 - y1;
      const fx = x1 - cx;
      const fy = y1 - cy;
      
      const a = dx * dx + dy * dy;
      const b = 2 * (fx * dx + fy * dy);
      const c = fx * fx + fy * fy - r * r;
      
      const discriminant = b * b - 4 * a * c;
    
      if (discriminant < 0) {
        //returnvalue = false; // No intersection
      //  console.log(discriminant);
      } else if (discriminant === 0) {
        const t = -b / (2*a);
        goalnode.value[0] = x1 + t * dx;
        goalnode.value[1] = y1 + t * dy;

        console.log(x1,"->", goalnode.value[0])
        console.log(y1,"->", goalnode.value[1])
        returnvalue = true; // Tangent to the circle
      } else {
      //  console.log(cx,cy,r)
        returnvalue = true; // Intersects the circle at two points
      } 
    }
    })
    return returnvalue;
  }
  
  

  findNearbyNodes(newNode, radius) {
    const nearbyNodes = [];
  
    this.tree.traverseDFS(this.tree.root, (node) => {
      const distance = node.distanceTo(newNode)
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
      totalDistance += currentNode.distanceTo(currentNode.parent)
      currentNode = currentNode.parent;
    }
    return totalDistance;
  }
  
  
  findPath() {
    let path = [];
    let foundGoal = false;
  
    while (!foundGoal && this.maxStepCount > this.count) {
      this.count++;
      const newNode = this.expand();
      if (newNode) {
        path.push(newNode);
        if (this.calculateDistance(newNode.value, this.goal) <= this.maxStepSize) {
          path.push(this.goal);
          foundGoal = true;
          this.goalnode.parent = newNode;
          this.rewireAllNodes();
        }
      }
    }
 
    return path;
  }

  addNodes(count) {
    
  
    for(let i = 0; i < count; i++) {

    const newNode = this.expand()
     
     if(newNode) {
      if (this.calculateDistance(newNode.value, this.goal) <= this.maxStepSize) {
        
        this.goalnode.parent = newNode;
        this.rewireAllNodes();
        }
      }
    }
  
    this.visualize();
  }

  visualize() {
    this.canvas.clear();
    this.rewireAllNodes();
    console.log("what");
          this.obstacles.children.forEach(obj => {
            obj.position.set(obj.position.x , obj.position.z , obj.position.y)
          })
          
        this.canvas.rotation.x = (Math.PI/2)
    
    const treeMaterial = new THREE.LineBasicMaterial({ color: 0x0fffff });

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
    const treeMaterial = new THREE.LineBasicMaterial({ color: 0xff0ff0 });
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setFromPoints(points);
    const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
    this.canvas.add(edgeLine);
    console.log(this.calculateTotalDistance(this.goalnode))
    }

}
