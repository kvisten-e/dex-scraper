export async function* batchTasks(tasks, limit, taskCallback = (r) => r) {
  for (let i = 0; i < tasks.length; i = i + limit) {
    const batch = tasks.slice(i, i + limit);
    const result = await Promise.all(
      batch.map((task) => task().then((r) => taskCallback(r)))
    );
    yield result;
  }
}