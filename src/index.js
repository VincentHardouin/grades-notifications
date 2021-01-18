const fastify = require('fastify')({ logger: true });
const notifyNewGrades = require('./domain/usecases/notify-new-grades');

fastify.get('/', async (request, reply) => {
  try {
    const result = await notifyNewGrades();
    return reply.code(200).send(result);
  } catch (e) {
    console.error(e);
    return reply.code(500).send();
  }
});

const start = async () => {
  try {
    await fastify.listen(8080);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
