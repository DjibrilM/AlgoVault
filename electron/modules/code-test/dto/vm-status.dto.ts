/**
 * @file vm-status.dto.ts
 * @description NestJS DTOs for virtual machine status and toolchain queries.
 */

/**
 * Data Transfer Object reporting operational status and runtime versions of SandboxVm.
 */
export interface VmStatusDto {
  /** True if the QEMU process is currently spawned and accepting commands */
  running: boolean

  /** Runtime toolchain versions (node, python, gcc, kernel) reported by the guest agent */
  versions: Record<string, string>
}

