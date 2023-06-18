export class TreeNode {
  constructor(value, parent = null) {
    this.id = Math.round(Math.random() * 1000000);
    this.value = value;
    this.children = [];
    this.parent = parent;
    this.distanceToParent = 0;
    this.totaldistance = 0;
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

  clone() {
    const clonedNode = new TreeNode(this.value, this.parent);
    clonedNode.id = this.id;
    clonedNode.distanceToParent = this.distanceToParent;
    clonedNode.totaldistance = this.totaldistance;

   // console.warn(this.children)
    for (const child of this.children) {
      const clonedChild = child.clone();
      clonedNode.addChild(clonedChild);
    }

    return clonedNode;
  }
}

export class Tree {
  constructor(rootValue) {
    this.root = new TreeNode(rootValue);
    this.size = 1;
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

  clone() {
    const clonedTree = new Tree(this.root.value);
    const visitedNodes = new Map();

    this.traverseBFS((node) => {
      const clonedNode = visitedNodes.get(node) || node.clone();
      visitedNodes.set(node, clonedNode);

      const parentNode = node.getParent();
      if (parentNode) {
        const clonedParentNode = visitedNodes.get(parentNode);
        clonedParentNode.addChild(clonedNode);
      } else {
        clonedTree.root = clonedNode;
      }
    });

    clonedTree.size = this.size;
    return clonedTree;
  }
}
