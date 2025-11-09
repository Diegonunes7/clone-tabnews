import database from "infra/database.js";
import packageJson from "../../../../package.json";

const serverStartedAt = Date.now();

function buildApplicationStatus() {
  const uptimeSeconds = Math.floor((Date.now() - serverStartedAt) / 1000);
  return {
    name: packageJson.name,
    version: packageJson.version,
    uptime_seconds: uptimeSeconds,
    environment: process.env.NODE_ENV || "development",
  };
}

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const queryVersionDataBaseResult = await database.query("SHOW server_version;");
    const queryVersionDataBaseValue = parseInt(
      queryVersionDataBaseResult.rows[0].server_version,
    );

    const maxConnectionsDataBaseResult = await database.query("SHOW max_connections;");
    const maxConnectionsDataBaseValue = parseInt(
      maxConnectionsDataBaseResult.rows[0].max_connections,
    );

    const databaseName = process.env.POSTGRES_DB;
    const rountConnectionsDataBaseResult = await database.query({
      text: "SELECT count(*)::int as count_connections FROM pg_stat_activity where datname = $1",
      values: [databaseName],
    });
    const rountConnectionsDataBaseValue =
      rountConnectionsDataBaseResult.rows[0].count_connections;

    const application = buildApplicationStatus();

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: queryVersionDataBaseValue,
          max_connections: maxConnectionsDataBaseValue,
          count_connections: rountConnectionsDataBaseValue,
        },
      },
      application,
    });
  } catch (error) {
    response.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

export default status;
