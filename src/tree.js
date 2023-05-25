export class TreeNode {
  constructor(value) {
    this.value = value;
    this.children = [];
    this.parent = null;
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
