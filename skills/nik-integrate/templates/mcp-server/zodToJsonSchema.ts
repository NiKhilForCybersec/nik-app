/* Tiny Zod → JSON Schema converter.
 * Intentionally minimal — covers what the Nik registry actually uses
 * (objects, strings, numbers, booleans, enums, arrays, optionals,
 *  defaults, uuids). For richer cases, swap in the `zod-to-json-schema`
 * package. Kept inline so the MCP server has no extra runtime deps. */

import type { z } from 'zod';

export function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const def = (schema as any)._def;
  const t = def?.typeName ?? def?.type;

  switch (t) {
    case 'ZodObject':
    case 'object': {
      const shape =
        typeof def.shape === 'function' ? def.shape() : (def.shape ?? {});
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        const inner = value as z.ZodType;
        properties[key] = zodToJsonSchema(inner);
        const innerT = (inner as any)._def?.typeName ?? (inner as any)._def?.type;
        if (innerT !== 'ZodOptional' && innerT !== 'optional' && innerT !== 'ZodDefault' && innerT !== 'default') {
          required.push(key);
        }
      }
      const out: Record<string, unknown> = { type: 'object', properties };
      if (required.length) out.required = required;
      if (def.unknownKeys === 'strict' || def.strict) out.additionalProperties = false;
      return out;
    }

    case 'ZodString':
    case 'string': {
      const out: Record<string, unknown> = { type: 'string' };
      const checks = def.checks ?? [];
      for (const c of checks) {
        if (c.kind === 'min' || c._zod?.def?.check === 'min_length') out.minLength = c.value ?? c._zod.def.minimum;
        if (c.kind === 'max' || c._zod?.def?.check === 'max_length') out.maxLength = c.value ?? c._zod.def.maximum;
        if (c.kind === 'uuid' || c._zod?.def?.format === 'uuid') out.format = 'uuid';
      }
      return out;
    }

    case 'ZodNumber':
    case 'number': {
      const out: Record<string, unknown> = { type: 'number' };
      const checks = def.checks ?? [];
      for (const c of checks) {
        if (c.kind === 'int' || c._zod?.def?.check === 'number_format' && c._zod?.def?.format === 'safeint') out.type = 'integer';
        if (c.kind === 'min' || c._zod?.def?.check === 'greater_than') out.minimum = c.value ?? c._zod.def.value;
        if (c.kind === 'max' || c._zod?.def?.check === 'less_than') out.maximum = c.value ?? c._zod.def.value;
      }
      return out;
    }

    case 'ZodBoolean':
    case 'boolean':
      return { type: 'boolean' };

    case 'ZodEnum':
    case 'enum':
      return { type: 'string', enum: def.values ?? def.entries ? Object.values(def.entries ?? {}) : [] };

    case 'ZodArray':
    case 'array': {
      const inner = def.type ?? def.element;
      return { type: 'array', items: zodToJsonSchema(inner) };
    }

    case 'ZodNullable':
    case 'nullable': {
      const inner = zodToJsonSchema(def.innerType ?? def.type);
      return { ...inner, nullable: true } as Record<string, unknown>;
    }

    case 'ZodOptional':
    case 'optional':
      return zodToJsonSchema(def.innerType ?? def.type);

    case 'ZodDefault':
    case 'default': {
      const inner = zodToJsonSchema(def.innerType ?? def.type);
      const dv = typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue;
      return { ...inner, default: dv };
    }

    case 'ZodLiteral':
    case 'literal':
      return { const: def.value ?? def.values?.[0] };

    case 'ZodAny':
    case 'any':
      return {};

    default:
      return { description: `(unsupported Zod type: ${t})` };
  }
}
