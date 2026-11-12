/**
 * @file lifecycle.ts
 * @description NestJS-style lifecycle hook interfaces for modules and services.
 */

/**
 * Interface defining lifecycle method invoked once a module or service has been initialized.
 */
export interface OnModuleInit {
  onModuleInit(): void | Promise<void>
}

/**
 * Interface defining lifecycle method invoked when the module or application is terminating.
 */
export interface OnModuleDestroy {
  onModuleDestroy(): void | Promise<void>
}

