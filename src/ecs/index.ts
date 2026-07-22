export type Entity = number;

export type ComponentClass<T = any> = new (...args: any[]) => T;

const MAX_COMPONENT_TYPES = 31;

const componentIds = new Map<ComponentClass, number>();
let nextComponentId = 0;

function componentId(ctor: ComponentClass): number {
  let id = componentIds.get(ctor);
  if (id === undefined) {
    if (nextComponentId >= MAX_COMPONENT_TYPES) {
      throw new Error(`ECS: more than ${MAX_COMPONENT_TYPES} component types registered`);
    }
    id = nextComponentId++;
    componentIds.set(ctor, id);
  }
  return id;
}

export interface QueryDescriptor {
  all?: ComponentClass[];
  none?: ComponentClass[];
}

export class Query {
  readonly allMask: number;
  readonly noneMask: number;
  readonly entities = new Set<Entity>();

  constructor(descriptor: QueryDescriptor) {
    this.allMask = maskOf(descriptor.all ?? []);
    this.noneMask = maskOf(descriptor.none ?? []);
  }

  matches(mask: number): boolean {
    return (mask & this.allMask) === this.allMask && (mask & this.noneMask) === 0;
  }

  toArray(): Entity[] {
    return [...this.entities];
  }

  [Symbol.iterator](): IterableIterator<Entity> {
    return this.entities.values();
  }
}

function maskOf(ctors: ComponentClass[]): number {
  let mask = 0;
  for (const c of ctors) mask |= 1 << componentId(c);
  return mask;
}

export abstract class System {
  world!: World;
  enabled = true;

  init(): void { }

  abstract update(dt: number): void;
}

export class World {
  private nextEntity: Entity = 1;
  private readonly masks = new Map<Entity, number>();
  private readonly stores: Map<Entity, unknown>[] = [];
  private readonly queries: Query[] = [];
  private readonly systems: System[] = [];

  createEntity(): Entity {
    const entity = this.nextEntity++;
    this.masks.set(entity, 0);
    return entity;
  }

  destroyEntity(entity: Entity): void {
    if (!this.masks.has(entity)) return;
    for (const store of this.stores) store.delete(entity);
    this.masks.delete(entity);
    for (const query of this.queries) query.entities.delete(entity);
  }

  addComponent<T extends object>(entity: Entity, component: T): T {
    const id = componentId(component.constructor as ComponentClass);
    this.storeFor(id).set(entity, component);
    this.setMask(entity, (this.masks.get(entity) ?? 0) | (1 << id));
    return component;
  }

  removeComponent(entity: Entity, ctor: ComponentClass): void {
    const id = componentId(ctor);
    this.storeFor(id).delete(entity);
    this.setMask(entity, (this.masks.get(entity) ?? 0) & ~(1 << id));
  }

  getComponent<T>(entity: Entity, ctor: ComponentClass<T>): T | undefined {
    return this.storeFor(componentId(ctor)).get(entity) as T | undefined;
  }

  get<T>(entity: Entity, ctor: ComponentClass<T>): T {
    const component = this.getComponent(entity, ctor);
    if (component === undefined) {
      throw new Error(`ECS: entity ${entity} has no component ${ctor.name}`);
    }
    return component;
  }

  hasComponent(entity: Entity, ctor: ComponentClass): boolean {
    const mask = this.masks.get(entity) ?? 0;
    return (mask & (1 << componentId(ctor))) !== 0;
  }

  createQuery(descriptor: QueryDescriptor): Query {
    const query = new Query(descriptor);
    for (const [entity, mask] of this.masks) {
      if (query.matches(mask)) query.entities.add(entity);
    }
    this.queries.push(query);
    return query;
  }

  private singletonEntity: Entity | null = null;

  setSingleton<T extends object>(component: T): T {
    if (this.singletonEntity === null) this.singletonEntity = this.createEntity();
    return this.addComponent(this.singletonEntity, component);
  }

  singleton<T>(ctor: ComponentClass<T>): T {
    if (this.singletonEntity === null) throw new Error('ECS: no singleton entity');
    return this.get(this.singletonEntity, ctor);
  }

  addSystem(system: System): this {
    system.world = this;
    this.systems.push(system);
    system.init();
    return this;
  }

  update(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled) system.update(dt);
    }
  }

  private storeFor(id: number): Map<Entity, unknown> {
    let store = this.stores[id];
    if (store === undefined) {
      store = new Map<Entity, unknown>();
      this.stores[id] = store;
    }
    return store;
  }

  private setMask(entity: Entity, mask: number): void {
    this.masks.set(entity, mask);
    for (const query of this.queries) {
      if (query.matches(mask)) query.entities.add(entity);
      else query.entities.delete(entity);
    }
  }
}
