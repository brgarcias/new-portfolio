// NODE
import fs from 'node:fs';
import path from 'node:path';
// I18N
import { defaultLocale, type Locale } from '@/src/i18n/config';

// The tests build with a fixed copy, in tests/fixtures/content, so edits
// made in the panel do not change what they check (TEST_CONTENT=1). Both
// folders are written out: from a path the build cannot read, Next.js would
// copy the whole project, .git included, into the server function.
const contentDir = path.join(
  process.cwd(),
  process.env.TEST_CONTENT ? 'tests/fixtures/content' : 'content',
);

// A content file holds a block per language, as the panel (Decap CMS) saves
// it with the single_file structure.
type Localized<T> = Record<string, unknown> & Record<typeof defaultLocale, T>;

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// What a translation leaves empty comes from English, field by field. Lists
// are translated as a whole.
function merge(base: unknown, translated: unknown): unknown {
  if (isEmpty(translated)) return base;
  if (isObject(base) && isObject(translated)) {
    const result: Record<string, unknown> = { ...base };
    for (const key of Object.keys(translated)) {
      result[key] = merge(base[key], translated[key]);
    }
    return result;
  }
  return translated;
}

function readLocalized<T>(file: string, locale: Locale): T {
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as Localized<T>;
  return merge(data[defaultLocale], data[locale]) as T;
}

// One of the files in content/site, such as the texts of the top.
export function readSingleton<T>(name: string, locale: Locale): T {
  return readLocalized<T>(
    path.join(contentDir, 'site', `${name}.json`),
    locale,
  );
}

// Every entry of a folder in content/, such as the experiences, with the
// file name as its slug.
export function readCollection<T>(
  name: string,
  locale: Locale,
): (T & { slug: string })[] {
  const folder = path.join(contentDir, name);
  return fs
    .readdirSync(folder)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => ({
      ...readLocalized<T>(path.join(folder, file), locale),
      slug: file.replace(/\.json$/, ''),
    }));
}
