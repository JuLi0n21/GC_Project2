import * as THREE from "three";
let i = 0;

export class TreeNode {
  constructor(value, parent = null) {
    this.id = i++;
    this.value = value
    this.children = [];
    this.parent = parent;
    this.distanceToParent = 0;
    this.totalDistance = 0;
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

  getParent() {
    return this.parent;
  }

  distanceTo(node) {
    const dx = node.value[0] - this.value[0];
    const dy = node.value[1] - this.value[1];
    const dz = node.value[2] - this.value[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  euclideanDistance(nodeA, nodeB) {
    const dx = nodeB.value[0] - nodeA.value[0];
    const dy = nodeB.value[1] - nodeA.value[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

}

export class Tree {
  constructor(rootValue) {
    this.root = new TreeNode(rootValue);
    this.size = 1;
    this.root.totalDistance = 0;
  }

  traverseDFS(root, callback) {
   
    const stack = [];
    stack.push(root);

    while (stack.length > 0) {
      const node = stack.pop();
      callback(node);

      for (const child of node.children) {
        stack.push(child);
      }
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
