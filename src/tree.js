export class TreeNode {
  constructor(value , parent = null) {
    this.value = value;
    this.children = [];
    this.parent = parent;
    this.distance = Infinity;
    this.totaldistance = Infinity;
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

  euclideanDistance(nodeA, nodeB) {
    console.log(nodeA, nodeB)
    const dx = nodeB.value[0] - nodeA.value[0];
    const dy = nodeB.value[1] - nodeA.value[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  
}

export class Tree {
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
