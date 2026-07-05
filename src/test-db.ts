// Test script for IndexedDB storage layer
// Note: IndexedDB requires a browser environment
// Run this via useEffect in App.tsx or in a browser console

import { db } from './lib/db';

export async function testDb() {
  console.log('Testing IndexedDB storage layer...');

  // Test save and get
  const testValue = 123;
  await db.save('test', testValue);
  const retrieved = await db.get('test');
  console.log(`Saved: ${testValue}, Retrieved: ${retrieved}`);

  if (retrieved === testValue) {
    console.log('✓ Save and get test PASSED');
  } else {
    console.log('✗ Save and get test FAILED');
    throw new Error('Save and get test failed');
  }

  // Test remove
  await db.remove('test');
  const afterRemove = await db.get('test');
  console.log(`After remove: ${afterRemove}`);

  if (afterRemove === undefined) {
    console.log('✓ Remove test PASSED');
  } else {
    console.log('✗ Remove test FAILED');
    throw new Error('Remove test failed');
  }

  // Test reset
  await db.save('test2', 'hello');
  await db.reset();
  const afterReset = await db.get('test2');
  console.log(`After reset: ${afterReset}`);

  if (afterReset === undefined) {
    console.log('✓ Reset test PASSED');
  } else {
    console.log('✗ Reset test FAILED');
    throw new Error('Reset test failed');
  }

  console.log('All tests passed!');
  return true;
}