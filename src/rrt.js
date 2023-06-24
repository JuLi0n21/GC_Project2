import * as THREE from "three";
import { Tree, TreeNode } from "./tree";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

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
    this.generatedpoints = [];
    this.loader = new FontLoader();
    this.goalnode = new TreeNode( [goal[0], goal[1], goal[2]] );

    this.tree = new Tree(start);
  }

  generateRandomNode() {
    const x = Math.random() * this.range - this.range/2; 
    const y = Math.random() * this.range ; 
    const z = Math.random() * this.range - this.range/2; 
    this.generatedpoints.push([x,y,z])
    return new TreeNode( ( [x,y,z] ), null);
  }

  findNearestNode(inputnode) {
    let nearestNode = null;
    let nearestDistance = Infinity;
    let i = 0;

   // console.log("size:", this.tree.size)

    this.tree.traverseDFS(this.tree.root, (node) => {

      const distance = inputnode.distanceTo(node);
      //console.log(distance, inputnode.id, node.id)
      //this.linehelper(inputnode.value[0],inputnode.value[1],inputnode.value[2],node.value[0],node.value[1],node.value[2],distance.toString(),"red");

      if (distance < nearestDistance) {
        nearestNode = node;
        nearestDistance = distance;
      }
    });

    return nearestNode;
  }


  LerpNewNode(nearestNode, node) {

    let nodeVec = new THREE.Vector3( nearestNode.value[0], nearestNode.value[1], nearestNode.value[2]) 
    let nearbyVec = new THREE.Vector3( node.value[0], node.value[1], node.value[2]);

    if(nodeVec.distanceTo(nearbyVec) > this.maxStepSize)
    {
      let cutVec3 = new THREE.Vector3().lerpVectors(nodeVec,nearbyVec,(this.maxStepSize/nodeVec.distanceTo(nearbyVec)))

   /* console.log("calced dis:", (nodeVec.distanceTo(nearbyVec) * this.maxStepSize/nodeVec.distanceTo(nearbyVec)));
      console.log("distance:",cutVec3.distanceTo(nodeVec))
      console.log(cutVec3)
    */
      node.value[0] = cutVec3.x;
      node.value[1] = cutVec3.y; 
      node.value[2] = cutVec3.z;

     /* console.log(node.value)

        console.log("calcdis2", node.distanceTo(nearestNode))
    */
      }

    //console.log(node.value)

    return node;
  }


  isCollisionFree(node, nearestNode) {
    let returnvalue = true;
    const raycaster = new THREE.Raycaster()

    let origin = new THREE.Vector3(nearestNode.value[0], nearestNode.value[1], nearestNode.value[2]);
   
    let direction = new THREE.Vector3().lerpVectors(origin, new THREE.Vector3(node.value[0], node.value[1], node.value[2]),0.01)
    //let direction =  new THREE.Vector3(node.value[0], node.value[1], node.value[2])
   raycaster.set(direction, origin);
   //raycaster.far = this.maxStepSize;
    //console.log(raycaster.ray)

   // this.linehelper(origin.x,origin.y,origin.z,direction.x,direction.y,direction.z, "facts", "red");

//    console.log(this.obstacles.children)
    let intersectoins = raycaster.intersectObjects(this.obstacles.children, false);

      
    if(intersectoins.length > 0){
      //console.warn("intersetion", intersectoins)
      returnvalue = false
     // console.log(intersectoins[0])
     // intersectoins[0].object.position.set(0,0,0)
    }

    return returnvalue;
  }
  

  expand() {
    const randomNode = this.generateRandomNode();
    const nearestNode = this.findNearestNode(randomNode);
    const newNode = this.LerpNewNode(nearestNode, randomNode);

    if (this.isCollisionFree(newNode, nearestNode)) {
      nearestNode.addChild(newNode);
      return newNode;
    }

    return null;
  }

  addNodes(count) {

    if(this.goalnode.parent == null) {
    for (let i = 0; i < count; i++) {
      const newNode = this.expand();

      if (newNode) {

        if (newNode.distanceTo(this.goalnode) <= this.maxStepSize * 2) {
          this.goalnode.parent = newNode;
         
        }
      }
    }
    this.visualize() 
    return false
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
        //console.log(this.goalnode.distanceTo(newNode))
        if (newNode.distanceTo(this.goalnode) <= this.maxStepSize) {
          path.push(this.goal);
          foundGoal = true;
          this.goalnode = newNode;
        }
      }
    }

    return path;
  }

  linehelper(x1,y1,z1,x2,y2,z2,text = null,Color = "#ffffff") {
    //console.log("drawin line")
    const points = [];
    let height = -0.1;
    points.push(new THREE.Vector3(x1,y1,z1))
    points.push(new THREE.Vector3(x2,y2,z2))
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
          height: 0.001,
          curveSegments: 5,

        } );
      
       // console.log("creating text")
        const midpoint = new THREE.Vector3().addVectors(new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x2,y2,z2)).multiplyScalar(0.5);
        //console.log(midpoint)
        textMesh = new THREE.Mesh(textGeometry, treeMaterial);
        textMesh.position.copy(midpoint);
        canvas.add(textMesh)
       // console.warn(canvas);
      } );
        
    }
  
  }

  async visualize() {

    this.canvas.clear()
        //this.canvas.rotation.x = (Math.PI/2)
    //ADD A visulisation from the goal node to the root node
    //ALSO add line from last node to goal
    //think about turning this into 3d
    //make a RRT* (path optimization)
    if(this.path !== null) {
    //this.findPath();
    }
    // Create material for the tree edges
    const treeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    this.tree.traverseDFS(this.tree.root, (node) => {
      for (const child of node.children) {
        const edgeGeometry = new THREE.BufferGeometry();
        const edgePoints = [
          new THREE.Vector3(node.value[0], node.value[1], node.value[2]),
          new THREE.Vector3(child.value[0], child.value[1], child.value[2]),
        ];
        edgeGeometry.setFromPoints(edgePoints);
        const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
        this.canvas.add(edgeLine);
      }
    });

    const geometry = new THREE.SphereGeometry( 0.1, 32, 16 ); 
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
    const sphere = new THREE.Mesh( geometry, material ); 

    this.generatedpoints.forEach(obj => {
      const spherecopy = sphere.clone()
      spherecopy.position.set(obj[0],obj[1],obj[2])
   //   this.canvas.add(spherecopy);
    })

    const startGeometry = new THREE.SphereGeometry(0.1, 32);
    const startMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const startMesh = new THREE.Mesh(startGeometry, startMaterial);
    startMesh.position.set(this.start[0], this.start[1], this.start[2]);
    this.canvas.add(startMesh);

    const goalGeometry = new THREE.SphereGeometry(this.maxStepSize, 32);
    const goalMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    const goalMesh = new THREE.Mesh(goalGeometry, goalMaterial);
    goalMesh.position.set(this.goal[0], this.goal[1], this.goal[2]);
    this.canvas.add(goalMesh);

    this.drawGoalPath(this.goalnode);

   // console.log(this.tree)
  }

  drawGoalPath(goalnode) {
    const points = [];
    while (goalnode.parent != null) {
      points.push(new THREE.Vector3(goalnode.value[0], goalnode.value[1], goalnode.value[2]));
      console.log(goalnode)
      goalnode = goalnode.parent;
    }
    
   
    points.push(new THREE.Vector3(this.tree.root.value[0], this.tree.root.value[1], this.tree.root.value[2]))
    const treeMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setFromPoints(points);
    const edgeLine = new THREE.Line(edgeGeometry, treeMaterial);
    this.canvas.add(edgeLine);
  }
}
