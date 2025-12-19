import { Prisma } from '@prisma/client';

// Check what fields are available in BlobFileWhereUniqueInput
type UniqueInput = Prisma.BlobFileWhereUniqueInput;

// This should compile if pathname is recognized as unique
const test1: UniqueInput = { pathname: 'test.mdx' };
console.log('✅ pathname is recognized as unique:', test1);

// This should also work
const test2: UniqueInput = { id: 'some-id' };
console.log('✅ id is recognized as unique:', test2);

// Check if url is still unique (it should NOT be)
// Uncommenting this should cause a type error if migration worked:
// const test3: UniqueInput = { url: 'http://example.com' };

console.log('✅ All type checks passed!');
