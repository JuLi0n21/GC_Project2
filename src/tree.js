let i = 0;

export class TreeNode {
  constructor(value, parent = null) {
    this.id = i++;
    this.value = value;
    this.children = [];
    this.parent = parent;
    this.distanceToParent = 0;
    this.totalDistance = 0;
   // console.log(this.id);
  }

  addChild(node) {
    node.parent = this;
   // console.warn("child",node)
    this.children.push(node);
   // console.log(this.children)
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

  distanceTo(Node) {
    const dx = Node.value[0] - this.value[0];
    const dy = Node.value[1] - this.value[1];
    return Math.sqrt(dx * dx + dy * dy);
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
      //console.log(node.id)
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
