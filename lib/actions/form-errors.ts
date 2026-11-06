import { ZodError, defaultErrorMap, type ZodIssue, type ZodIssueOptionalMessage } from "zod";

/**
 * Mengubah error validasi Zod menjadi satu kalimat bahasa Inggris yang menyebut nama field yang terlihat
 * di form ("Room title must be at least 3 characters."), bukan key skema mentah ("title: String must…").
 * Aturan validasinya sendiri tetap di lib/validation; modul ini hanya merangkai pesan.
 */

/** Nama field seperti di label form, plus pesan khusus opsional (batas array, format teks). */
export type FieldSpec = string | { label: string; tooSmall?: string; tooBig?: string; invalid?: string };

/** Array bersarang (mis. tasks.0.description): "Task 1: instructions must be…". */
export type NestedSpec = { item: string; fields?: Record<string, FieldSpec> };

export type FieldLabels = {
  fields: Record<string, FieldSpec>;
  nested?: Record<string, NestedSpec>;
};

/** Untuk field tersembunyi (id) yang tidak bisa diperbaiki pengguna. */
export const STALE_FORM_MESSAGE = "This form is out of date. Reload the page and try again.";

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

/** "a role", "an audience". */
function withArticle(noun: string) {
  return `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;
}

function count(value: number | bigint) {
  return Number(value).toLocaleString("en-US");
}

/** "estimatedMinutes" -> "Estimated minutes" sebagai cadangan bila label tidak dikenal. */
function humanize(key: string) {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** True bila pesan issue adalah teks bawaan Zod (bukan pesan khusus dari skema). */
function hasDefaultMessage(issue: ZodIssue) {
  const { message, ...rest } = issue;
  try {
    return message === defaultErrorMap(rest as ZodIssueOptionalMessage, { defaultError: "\u0000", data: undefined }).message;
  } catch {
    return false;
  }
}

function resolveField(issue: ZodIssue, labels: FieldLabels) {
  const [head, index, child] = issue.path;
  const key = typeof head === "string" ? head : "";
  const nested = labels.nested?.[key];

  if (nested && typeof index === "number") {
    const itemName = `${nested.item} ${index + 1}`;
    if (typeof child !== "string") return { known: true, prefix: "", spec: { label: itemName } as FieldSpec };
    const spec = nested.fields?.[child] ?? humanize(child);
    return { known: true, prefix: `${itemName}: `, spec };
  }

  const spec = labels.fields[key];
  if (spec) return { known: true, prefix: "", spec };
  return { known: false, prefix: "", spec: (key ? humanize(key) : "This field") as FieldSpec };
}

function sentenceFor(issue: ZodIssue, label: string, spec: FieldSpec, known: boolean): string {
  const custom: Exclude<FieldSpec, string> = typeof spec === "string" ? { label: spec } : spec;
  const name = lowerFirst(label);

  switch (issue.code) {
    case "invalid_type": {
      const missing = issue.received === "undefined" || issue.received === "null" || issue.received === "nan";
      if (issue.expected === "number" || issue.expected === "integer" || issue.expected === "bigint") {
        return missing ? `Enter a number for ${name}.` : `${label} must be a whole number.`;
      }
      return missing ? `${label} is required.` : `Check ${name} and try again.`;
    }
    case "too_small": {
      if (custom.tooSmall) return custom.tooSmall;
      const minimum = count(issue.minimum);
      if (issue.type === "string") {
        return Number(issue.minimum) <= 1 ? `${label} is required.` : `${label} must be at least ${minimum} characters.`;
      }
      if (issue.type === "number" || issue.type === "bigint") {
        return issue.inclusive ? `${label} must be at least ${minimum}.` : `${label} must be more than ${minimum}.`;
      }
      if (issue.type === "array" || issue.type === "set") return `Add at least ${minimum} to ${name}.`;
      return `Check ${name} and try again.`;
    }
    case "too_big": {
      if (custom.tooBig) return custom.tooBig;
      const maximum = count(issue.maximum);
      if (issue.type === "string") return `${label} must be ${maximum} characters or fewer.`;
      if (issue.type === "number" || issue.type === "bigint") {
        return issue.inclusive ? `${label} must be ${maximum} or less.` : `${label} must be less than ${maximum}.`;
      }
      if (issue.type === "array" || issue.type === "set") return `${label} can have up to ${maximum} entries.`;
      return `Check ${name} and try again.`;
    }
    case "invalid_string": {
      if (issue.validation === "uuid" || issue.validation === "cuid" || issue.validation === "cuid2") {
        return known ? `Choose ${withArticle(name)} from the list.` : STALE_FORM_MESSAGE;
      }
      if (custom.invalid) return custom.invalid;
      if (issue.validation === "email") return "Enter a valid email address, like name@example.com.";
      if (issue.validation === "regex") return `${label} contains characters that aren't allowed.`;
      return `Enter a valid ${name}.`;
    }
    case "invalid_enum_value":
      return known ? `Choose ${withArticle(name)} from the list.` : STALE_FORM_MESSAGE;
    default:
      return `Check ${name} and try again.`;
  }
}

/** Satu kalimat untuk satu issue Zod, dengan nama field yang terlihat pengguna. */
export function describeZodIssue(issue: ZodIssue, labels: FieldLabels): string {
  const { known, prefix, spec } = resolveField(issue, labels);
  const label = typeof spec === "string" ? spec : spec.label;

  // Pesan khusus dari skema (mis. aturan slug, "Mark exactly one option…") sudah ramah; cukup beri awalan item.
  const sentence = hasDefaultMessage(issue) ? sentenceFor(issue, label, spec, known) : issue.message;
  return prefix ? `${prefix}${lowerFirst(sentence)}` : sentence;
}

/** Pesan untuk issue pertama dari ZodError; pesan cadangan bila tidak ada issue. */
export function zodErrorMessage(error: ZodError, labels: FieldLabels, fallback = "Check the form and try again."): string {
  const issue = error.issues[0];
  return issue ? describeZodIssue(issue, labels) : fallback;
}
