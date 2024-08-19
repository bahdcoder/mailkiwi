const fs = require("fs");
const path = require("path");

const { Worker } = require("bullmq");
const { Queue } = require("bullmq");
const { Redis } = require("ioredis");
const OUTBOUND_QUEUE_EMAILS = "OUTBOUND_QUEUE_EMAILS";

exports.register = function () {
  const plugin = this;

  plugin.register_hook("queue_outbound", "hook_queue_outbound");

  plugin.register_hook("init_master", "start_queue_worker");
  plugin.register_hook("init_child", "start_queue_worker");

  // register background worker bullmq for processing outbound emails in the queue.
  // start worker if proces.env.EMAIL_QUEUE_PROCESS_RELAY = TRUE
  plugin.connect_io_redis();
};

exports.connect_io_redis = function () {
  this.ioredis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  this.outbound_queue = new Queue(OUTBOUND_QUEUE_EMAILS, {
    connection: this.ioredis,
  });
};

exports.start_queue_worker = function (next, server) {
  const plugin = this;

  const outbound_queue_worker = new Worker(
    OUTBOUND_QUEUE_EMAILS,
    async (job) => {
      const { message_stream, ...transaction_payload } = job.data;

      plugin.loginfo('Processing queue job: ', job.data.uuid);
    },
    { connection: this.ioredis },
  );

  plugin.outbound_queue_worker = outbound_queue_worker;

  outbound_queue_worker.on('error', (error) => {
    plugin.logerror("Failed to run bullmq queue worker:", error?.message, {
      error,
    });
  });

  plugin.lognotice("Started bullmq queue worker");
  next();
};

exports.hook_queue_outbound = function (next, connection, params) {
  const plugin = this;

  //   const outbound = require("./outbound");

  const { message_stream, results, ...transaction_payload } =
    connection.transaction;

  connection.transaction.message_stream.get_data((buffer) => {
    plugin.outbound_queue
      .add(connection.transaction.uuid, {
        message_stream: buffer.toString(),
        ...transaction_payload,
      })
      .then(() => {
        plugin.loginfo(
          connection,
          "Message " + transaction_payload.uuid + " added to queue.",
        );

        next(OK);
      })
      .catch((error) => {
        plugin.logerror(
          connection,
          "Message " + transaction_payload.uuid + " failed to add to queue.",
          error,
        );

        next();
      });
  });
};

exports.shutdown = function () {
  if (this.outbound_queue_workers) {
    this.outbound_queue_workers.forEach((worker) => {
      worker.close();
    });
  }

  if (this.ioredis) {
    this.ioredis.disconnect();
  }
};
