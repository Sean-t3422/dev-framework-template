/**
 * @fileoverview Resource Lock Manager
 *
 * Prevents parallel sub-agents from creating conflicting changes.
 * Implements read/write locks, deadlock prevention, and timeout monitoring.
 */

const RESOURCE_TYPES = {
  TABLE: 'table',
  MIGRATION: 'migration',
  ROUTE: 'route',
  COMPONENT: 'component',
  SERVICE_FUNCTION: 'service_function',
  TYPE_DEFINITION: 'type_definition',
  RLS_POLICY: 'rls_policy',
  FILE: 'file'
};

// Global resource ordering for deadlock prevention
const RESOURCE_ORDER = [
  RESOURCE_TYPES.MIGRATION,      // 1. Always first (sequential)
  RESOURCE_TYPES.TABLE,          // 2. Tables
  RESOURCE_TYPES.RLS_POLICY,     // 3. Policies (depend on tables)
  RESOURCE_TYPES.TYPE_DEFINITION, // 4. Types
  RESOURCE_TYPES.SERVICE_FUNCTION, // 5. Functions
  RESOURCE_TYPES.ROUTE,          // 6. Routes (depend on functions)
  RESOURCE_TYPES.COMPONENT,      // 7. Components (depend on routes)
  RESOURCE_TYPES.FILE            // 8. Generic files
];

class ResourceLockManager {
  constructor() {
    this.locks = new Map(); // resourceId -> { type, mode, lockedBy, acquiredAt, expiresAt }
    this.waitQueue = new Map(); // resourceId -> [blueprintIds]
    this.lockHistory = []; // For debugging
    this.timeouts = new Map(); // blueprintId -> timeout handle
    this.maxLockDuration = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Attempt to acquire locks for a blueprint
   * Returns { success: boolean, locks?: Resource[], conflicts?: Conflict[] }
   */
  async acquireLocks(blueprint) {
    const requiredLocks = this.extractRequiredLocks(blueprint);

    // Sort locks in global order to prevent deadlocks
    const sortedLocks = this.sortLockRequests(requiredLocks);

    const conflicts = [];

    // Check for conflicts
    for (const lock of sortedLocks) {
      const existing = this.locks.get(lock.identifier);

      if (existing && this.hasConflict(existing, lock, blueprint.id)) {
        conflicts.push({
          resource: lock.identifier,
          lockedBy: existing.lockedBy,
          requestedBy: blueprint.id
        });
      }
    }

    // If no conflicts, acquire all locks
    if (conflicts.length === 0) {
      for (const lock of sortedLocks) {
        const now = Date.now();
        this.locks.set(lock.identifier, {
          type: lock.type,
          mode: lock.mode,
          lockedBy: blueprint.id,
          acquiredAt: now,
          expiresAt: now + this.maxLockDuration
        });

        this.lockHistory.push({
          action: 'acquired',
          resourceId: lock.identifier,
          blueprintId: blueprint.id,
          timestamp: now
        });
      }

      // Start timeout monitoring
      this.startTimeout(blueprint.id);

      console.log(`[Lock] Acquired ${sortedLocks.length} locks for ${blueprint.id}`);

      return {
        success: true,
        locks: sortedLocks
      };
    }

    // Conflicts exist - add to wait queue
    console.log(`[Lock] ${blueprint.id} waiting for ${conflicts.length} resources`);

    for (const conflict of conflicts) {
      if (!this.waitQueue.has(conflict.resource)) {
        this.waitQueue.set(conflict.resource, []);
      }
      this.waitQueue.get(conflict.resource).push(blueprint.id);
    }

    return {
      success: false,
      conflicts,
      action: 'wait'
    };
  }

  /**
   * Release all locks held by a blueprint
   */
  releaseLocks(blueprintId) {
    const released = [];

    // Release all locks held by this blueprint
    for (const [resourceId, lock] of this.locks) {
      if (lock.lockedBy === blueprintId) {
        this.locks.delete(resourceId);
        released.push(resourceId);

        this.lockHistory.push({
          action: 'released',
          resourceId,
          blueprintId,
          timestamp: Date.now()
        });
      }
    }

    // Clear timeout
    this.clearTimeout(blueprintId);

    console.log(`[Lock] Released ${released.length} locks from ${blueprintId}`);

    // Process wait queue for released resources
    this.processWaitQueue(released);

    return released;
  }

  /**
   * Check if two lock requests conflict
   */
  hasConflict(existing, requested, requestedBy) {
    // Same blueprint can hold multiple locks
    if (existing.lockedBy === requestedBy) {
      return false;
    }

    // Check if lock has expired
    if (Date.now() > existing.expiresAt) {
      console.warn(`[Lock] Lock expired: ${existing.lockedBy} on ${requested.identifier}`);
      return false; // Treat as no conflict (will be cleaned up)
    }

    // Write locks are always exclusive
    if (existing.mode === 'write' || requested.mode === 'write') {
      return true;
    }

    // Read locks don't conflict with each other
    return false;
  }

  /**
   * Extract required locks from blueprint resources
   */
  extractRequiredLocks(blueprint) {
    const locks = [];

    // Table locks (write mode)
    if (blueprint.resources.tables) {
      for (const table of blueprint.resources.tables) {
        locks.push({
          type: RESOURCE_TYPES.TABLE,
          identifier: `table:${table}`,
          mode: 'write'
        });
      }
    }

    // Migration locks (always write, always sequential)
    if (blueprint.resources.migrations) {
      for (const migration of blueprint.resources.migrations) {
        locks.push({
          type: RESOURCE_TYPES.MIGRATION,
          identifier: `migration:${migration}`,
          mode: 'write'
        });
      }
    }

    // Route locks (write mode)
    if (blueprint.resources.routes) {
      for (const route of blueprint.resources.routes) {
        locks.push({
          type: RESOURCE_TYPES.ROUTE,
          identifier: `route:${route}`,
          mode: 'write'
        });
      }
    }

    // Component locks (write mode)
    if (blueprint.resources.components) {
      for (const component of blueprint.resources.components) {
        locks.push({
          type: RESOURCE_TYPES.COMPONENT,
          identifier: `component:${component}`,
          mode: 'write'
        });
      }
    }

    // Function locks (write mode)
    if (blueprint.resources.functions) {
      for (const func of blueprint.resources.functions) {
        locks.push({
          type: RESOURCE_TYPES.SERVICE_FUNCTION,
          identifier: `function:${func}`,
          mode: 'write'
        });
      }
    }

    return locks;
  }

  /**
   * Sort locks in global order to prevent deadlocks
   */
  sortLockRequests(locks) {
    return locks.sort((a, b) => {
      const orderA = RESOURCE_ORDER.indexOf(a.type);
      const orderB = RESOURCE_ORDER.indexOf(b.type);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Same type, sort alphabetically by identifier
      return a.identifier.localeCompare(b.identifier);
    });
  }

  /**
   * Start timeout monitoring for a blueprint
   */
  startTimeout(blueprintId) {
    const timeout = setTimeout(() => {
      console.warn(`[Lock] Blueprint ${blueprintId} exceeded max lock duration`);

      // Force release locks
      this.releaseLocks(blueprintId);

      // Mark blueprint as failed (handled by orchestrator)
      this.handleTimeout(blueprintId);
    }, this.maxLockDuration);

    this.timeouts.set(blueprintId, timeout);
  }

  /**
   * Clear timeout for a blueprint
   */
  clearTimeout(blueprintId) {
    const timeout = this.timeouts.get(blueprintId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(blueprintId);
    }
  }

  /**
   * Handle lock timeout
   */
  handleTimeout(blueprintId) {
    // Escalate to orchestrator for retry or manual intervention
    console.error(`[Lock] TIMEOUT: Blueprint ${blueprintId} held locks for >15 minutes`);
  }

  /**
   * Process wait queue when resources are released
   */
  processWaitQueue(releasedResources) {
    for (const resource of releasedResources) {
      const waiting = this.waitQueue.get(resource);

      if (waiting && waiting.length > 0) {
        console.log(`[Lock] Resource ${resource} now available for ${waiting.length} waiting blueprints`);
        // Orchestrator will retry acquisition for waiting blueprints
      }

      // Clean up empty queue entries
      this.waitQueue.delete(resource);
    }
  }

  /**
   * Get current lock status for visualization
   */
  getLockStatus() {
    const activeLocks = [];
    const waiting = [];

    for (const [resourceId, lock] of this.locks) {
      const age = Math.floor((Date.now() - lock.acquiredAt) / 1000);
      activeLocks.push({
        resource: resourceId,
        type: lock.type,
        mode: lock.mode,
        lockedBy: lock.lockedBy,
        ageSeconds: age
      });
    }

    for (const [resourceId, blueprints] of this.waitQueue) {
      waiting.push({
        resource: resourceId,
        waitingBlueprints: blueprints
      });
    }

    return { activeLocks, waiting };
  }

  /**
   * Check for stale locks and clean them up
   */
  cleanupStaleLocks() {
    const now = Date.now();
    const stale = [];

    for (const [resourceId, lock] of this.locks) {
      if (now > lock.expiresAt) {
        stale.push(resourceId);
      }
    }

    if (stale.length > 0) {
      console.warn(`[Lock] Cleaning up ${stale.length} stale locks`);

      for (const resourceId of stale) {
        const lock = this.locks.get(resourceId);
        this.locks.delete(resourceId);

        this.lockHistory.push({
          action: 'expired',
          resourceId,
          blueprintId: lock.lockedBy,
          timestamp: now
        });
      }

      this.processWaitQueue(stale);
    }
  }

  /**
   * Visualize current lock state
   */
  visualize() {
    console.log('\n=== Resource Locks ===\n');

    const status = this.getLockStatus();

    if (status.activeLocks.length === 0) {
      console.log('No active locks');
    } else {
      console.log('Active Locks:');
      status.activeLocks.forEach(lock => {
        console.log(`  ${lock.resource}`);
        console.log(`    Locked by: ${lock.lockedBy}`);
        console.log(`    Mode: ${lock.mode}`);
        console.log(`    Age: ${lock.ageSeconds}s`);
      });
    }

    if (status.waiting.length > 0) {
      console.log('\nWaiting Blueprints:');
      status.waiting.forEach(w => {
        console.log(`  ${w.resource}: ${w.waitingBlueprints.join(', ')}`);
      });
    }

    console.log('');
  }
}

module.exports = { ResourceLockManager, RESOURCE_TYPES };
