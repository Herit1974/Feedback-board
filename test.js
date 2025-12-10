// Very simple test so pipeline has something to run
console.log('Running basic test...');
if (1 + 1 !== 2) {
  console.error('Math broke 🤯');
  process.exit(1);
}
console.log('All good!');
