/**
 * @fileoverview Dependency Graph Builder
 *
 * Builds a DAG from blueprints, detects cycles, identifies resource conflicts,
 * and generates execution layers via topological sort.
 */

class DependencyGraphBuilder {
  constructor() {
    this.nodes = new Map(); // blueprintId -> BlueprintNode
    this.edges = new Map(); // blueprintId -> Set<dependencyId>
  }

  /**
   * Add a blueprint to the graph
   */
  addBlueprint(blueprint) {
    this.nodes.set(blueprint.id, blueprint);
    this.edges.set(blueprint.id, new Set(blueprint.dependsOn || []));
  }

  /**
   * Detect resource conflicts and add implicit dependencies
   * Two blueprints conflict if they access the same resource
   */
  detectResourceConflicts() {
    const blueprints = Array.from(this.nodes.values());

    for (let i = 0; i < blueprints.length; i++) {
      for (let j = i + 1; j < blueprints.length; j++) {
        const a = blueprints[i];
        const b = blueprints[j];

        const conflicts = this.findResourceConflicts(a, b);

        if (conflicts.length > 0) {
          // Add dependency: later blueprint depends on earlier one
          // (Earlier in array = created first = should execute first)
          this.addImplicitDependency(b.id, a.id, conflicts);
        }
      }
    }
  }

  /**
   * Find overlapping resources between two blueprints
   */
  findResourceConflicts(a, b) {
    const conflicts = [];

    // Check table conflicts
    const tableOverlap = a.resources.tables.filter(t =>
      b.resources.tables.includes(t)
    );
    conflicts.push(...tableOverlap.map(t => `table:${t}`));

    // Check migration conflicts (ALL migrations are sequential)
    if (a.resources.migrations.length > 0 && b.resources.migrations.length > 0) {
      conflicts.push('migrations:sequential');
    }

    // Check file conflicts
    const fileOverlap = this.findFileOverlaps(a.resources, b.resources);
    conflicts.push(...fileOverlap);

    // Check route conflicts
    const routeOverlap = a.resources.routes.filter(r =>
      b.resources.routes.includes(r)
    );
    conflicts.push(...routeOverlap.map(r => `route:${r}`));

    // Check component conflicts
    const componentOverlap = a.resources.components.filter(c =>
      b.resources.components.includes(c)
    );
    conflicts.push(...componentOverlap.map(c => `component:${c}`));

    return conflicts;
  }

  /**
   * Find file path overlaps
   */
  findFileOverlaps(resourcesA, resourcesB) {
    const overlaps = [];

    // Check if any function files overlap
    const funcOverlap = resourcesA.functions.filter(f =>
      resourcesB.functions.includes(f)
    );
    overlaps.push(...funcOverlap.map(f => `function:${f}`));

    return overlaps;
  }

  /**
   * Add implicit dependency based on resource conflicts
   */
  addImplicitDependency(dependentId, dependencyId, conflicts) {
    const deps = this.edges.get(dependentId);
    deps.add(dependencyId);

    console.log(
      `[DAG] Added implicit dependency: ${dependentId} depends on ${dependencyId}`,
      `(conflicts: ${conflicts.join(', ')})`
    );
  }

  /**
   * Detect cycles in the graph
   * Returns array of cycles found (empty if no cycles)
   */
  detectCycles() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.dfsDetectCycle(nodeId, visited, recursionStack, [], cycles);
      }
    }

    return cycles;
  }

  /**
   * DFS for cycle detection
   */
  dfsDetectCycle(nodeId, visited, recursionStack, path, cycles) {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const dependencies = this.edges.get(nodeId) || new Set();

    for (const depId of dependencies) {
      if (!visited.has(depId)) {
        this.dfsDetectCycle(depId, visited, recursionStack, path, cycles);
      } else if (recursionStack.has(depId)) {
        // Cycle detected
        const cycleStart = path.indexOf(depId);
        const cycle = path.slice(cycleStart);
        cycles.push(cycle);
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
  }

  /**
   * Generate execution layers using topological sort (Kahn's algorithm)
   * Returns array of layers, where each layer contains blueprints that can execute in parallel
   */
  generateExecutionLayers() {
    const layers = [];
    const completed = new Set();
    const inDegree = new Map();

    // Calculate in-degree for each node (how many dependencies does it have)
    for (const [nodeId, deps] of this.edges) {
      inDegree.set(nodeId, deps.size);
    }

    // Generate layers until all nodes are processed
    while (completed.size < this.nodes.size) {
      const currentLayer = [];

      // Find all nodes with no remaining dependencies (in-degree = 0)
      for (const [nodeId, degree] of inDegree) {
        if (degree === 0 && !completed.has(nodeId)) {
          // Push node ID, not the full node object
          currentLayer.push(nodeId);
        }
      }

      if (currentLayer.length === 0) {
        throw new Error('Circular dependency detected or graph error');
      }

      layers.push(currentLayer);

      // Mark as completed and update in-degrees
      for (const nodeId of currentLayer) {
        completed.add(nodeId);

        // Reduce in-degree for all nodes that depend on this one
        for (const [depNodeId, deps] of this.edges) {
          if (deps.has(nodeId)) {
            inDegree.set(depNodeId, inDegree.get(depNodeId) - 1);
          }
        }
      }
    }

    return layers;
  }

  /**
   * Visualize the graph for debugging
   */
  visualize() {
    console.log('\n=== Dependency Graph ===\n');

    for (const [nodeId, node] of this.nodes) {
      const deps = Array.from(this.edges.get(nodeId) || []);
      console.log(`[${nodeId}] ${node.name}`);

      if (deps.length > 0) {
        console.log(`  depends on: ${deps.join(', ')}`);
      }

      console.log(`  resources: ${JSON.stringify(node.resources)}`);
      console.log('');
    }
  }

  /**
   * Visualize execution layers
   */
  visualizeLayers(layers) {
    console.log('\n=== Execution Plan ===\n');

    let totalEstimatedTime = 0;

    layers.forEach((layer, index) => {
      const layerTime = Math.max(...layer.map(bp => bp.estimatedMinutes || 5));
      totalEstimatedTime += layerTime;

      console.log(`Layer ${index} (${layer.length} blueprints, ~${layerTime} min):`);

      if (layer.length === 1) {
        console.log(`  Sequential: ${layer[0].name}`);
      } else {
        console.log('  Parallel:');
        layer.forEach(bp => {
          console.log(`    - ${bp.name} (~${bp.estimatedMinutes || 5} min)`);
        });
      }
      console.log('');
    });

    console.log(`Estimated total time: ${totalEstimatedTime} minutes`);
    console.log(`Layers: ${layers.length}`);
    console.log('');
  }
}

module.exports = { DependencyGraphBuilder };
