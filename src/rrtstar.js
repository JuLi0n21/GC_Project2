import * as THREE from "three";
import { Tree, TreeNode } from "./tree";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

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
    this.tree = new Tree(  [ start[0], start[1] ] );
    this.goalnode = new TreeNode( [ goal[0], goal[1] ]);
    this.loader = new FontLoader();

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


  expand() {

    const randomPoint = this.generateRandomPoint();
    const nearestNode = this.findNearestNode(randomPoint);
    const newNode = this.generateNewNode(nearestNode, randomPoint);

    if (this.intersectionFree(newNode, nearestNode)) {

      const newNodeObj = new TreeNode(newNode, nearestNode);
      nearestNode.addChild(newNodeObj);

      
      newNodeObj.totalDistance = this.calculateTotalDistance(newNodeObj);
      newNodeObj.distanceToParent = newNodeObj.distanceTo(newNodeObj.parent)
      
      console.log(newNodeObj.totalDistance)
      this.tree.size++;
      console.log("tree size: ",this.tree.size)
       this.rewireAllNodes();

      return newNodeObj;
    }
  
    return null;
  }
 
  rewireAllNodes() {
    this.tree.traverseDFS(this.tree.root, (node) => {
      
      let shortestDistance = node.totalDistance;
      let closestNode = null;
      const nearbyNodes = this.findNearbyNodes(node, this.maxStepSize * 5);
  
      
      nearbyNodes.forEach((nearby) => {
        const distance = nearby.totalDistance + nearby.distanceTo(node);
  
      //  console.log("boefore short",distance)
        if (distance < shortestDistance && !this.createsCycle(node, nearby)) {
          shortestDistance = this.calculateTotalDistance(nearby) + nearby.distanceTo(node);
        //  console.log("after short",shortestDistance)
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
    //console.log("überprüfe:", node.id);
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
  
  findClosestPoint(x1, y1, x2, y2, x3, y3) {
    // Create the three points as Vector3 objects
    const point1 = new THREE.Vector3(x1, y1, 0);
    const point2 = new THREE.Vector3(x2, y2, 0);
    const point3 = new THREE.Vector3(x3, y3, 0);
  
    // Calculate the distances from the third point to the two given points
    const distanceToP1 = point3.distanceTo(point1);
    const distanceToP2 = point3.distanceTo(point2);
  
    // Determine the closest point
    let closestPoint;
    if (distanceToP1 < distanceToP2) {
      closestPoint = point1;
    } else {
      closestPoint = point2;
    }
  
    return closestPoint;
  }

  intersectionFree(originnode, goalnode) {

    let green = "#a103fc";
    let yellow = "#fcd703";
    let red = "#fc2003";
    let bule = "#1403fc";
    let purple = "#9403fc";
    let black = "#000000";
    let x1;
    let y1;
    let distance = 0;
    if(originnode.id == undefined) {
      x1 = originnode[0];
      y1 = originnode[1];
      console.log("point")
    } else {
      console.log("node")
      x1 = originnode.value[0];
      y1 = originnode.value[1];
    }
    let x2 = goalnode.value[0];
    let y2 = goalnode.value[1];
    let returnvalue = true;


  
   // this.linehelper(x1,y1,x2,y2,distance.toString(),red)
  
    let intersectionCount = 0;
    let intersectionPoint = null;
  
    this.obstacles.children.forEach((obj) => {
      if (obj.geometry.type !== "CylinderGeometry") {

        let cx = obj.position.x;
        let cy = obj.position.y;
        let r = obj.geometry.parameters.radius;

        let closestPoint = this.findClosestPoint(x1,y1,x2,y2,cx,cy)

        let closestdistance = new THREE.Vector3(x1,y1,0).distanceTo(new THREE.Vector3(cx,cy,0))
       // console.log(x1,y1, "-", x2,y2, "-", closestPoint)
          if(closestdistance < r){
            this.linehelper(x1,y1,cx,cy, null, red)
            returnvalue = false;
          } else {
            this.linehelper(x1,y1,cx,cy,null, bule)
        }

        closestdistance = new THREE.Vector3(x2,y2,0).distanceTo(new THREE.Vector3(cx,cy,0))
      // console.log(x1,y1, "-", x2,y2, "-", closestPoint)
          if(closestdistance < r){
            this.linehelper(x1,y1,cx,cy, null, red)
            returnvalue = false;
          } else {
            this.linehelper(x1,y1,cx,cy,null, bule)
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
    console.log(this.tree)
    this.canvas.clear();
    this.rewireAllNodes();
    console.log("what");
    
 
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

  linehelper(x1,y1,x2,y2,text = null,Color = "#ffffff") {
    const points = [];
    let height = -0.1;
    points.push(new THREE.Vector3(x1,y1,height))
    points.push(new THREE.Vector3(x2,y2,height))
    const treeMaterial = new THREE.LineBasicMaterial({ color: Color });
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setFromPoints(points);
    const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
    this.canvas.add(edgeLine);

    const canvas = this.canvas;

    let textMesh =  new THREE.Mesh();



     if(text !== null) {
				this.loader.load( 'assests/fonts/helvetiker_regular.typeface.json', function ( font ) {
					
        const textGeometry = new TextGeometry( text, {
	      
        font: font,
		    size: 0.01,
		    height: 0.01,
		    curveSegments: 5,

      } );
     
      console.log("creating text")
      const midpoint = new THREE.Vector3().addVectors(new THREE.Vector3(x1,y1,height), new THREE.Vector3(x2,y2,height)).multiplyScalar(0.5);
      //console.log(midpoint)
      textMesh = new THREE.Mesh(textGeometry, treeMaterial);
      textMesh.position.copy(midpoint);
      canvas.add(textMesh)
      console.warn(canvas);
    } );
      
  }
  
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
    //console.log(this.calculateTotalDistance(this.goalnode))
    this.linehelper(-3,3,3,-3,"edge");  

    this.dumbassfunction();
  }

  dumbassfunction() {
    // Assuming you have a Three.js scene and renderer set up

// Create the first line

// Create the line segment
const startPoint = new THREE.Vector3(0, 0, 0);
const endPoint = new THREE.Vector3(3, 4, 0);
const lineGeometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const line = new THREE.Line(lineGeometry, lineMaterial);
this.canvas.add(line);

// Define the length you want to remove
const lengthToRemove = 3;

// Calculate the direction vector of the line
const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();

// Calculate the new endpoint by subtracting the direction vector multiplied by the length to remove
const newEndPoint = endPoint.clone().sub(direction.clone().multiplyScalar(lengthToRemove));

// Update the line geometry with the new endpoint
line.geometry.setFromPoints([startPoint, newEndPoint]);
line.geometry.attributes.position.needsUpdate = true;


const lineGeometry2 = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
const lineMaterial2 = new THREE.LineBasicMaterial({ color: 0xffffff });
const line2 = new THREE.Line(lineGeometry2, lineMaterial2);
this.canvas.add(line2);

line2.position.x = 2;


  }

}
