const notifyNewGrades = require('./domain/usecases/notify-new-grades');

async function main() {
  try {
    await notifyNewGrades();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

if (require.main === module) {
  main().then(
    () => process.exit(0),
    (err) => {
      console.error(err);
      process.exit(1);
    },
  );
}
