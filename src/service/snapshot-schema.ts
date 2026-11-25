import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "../../docs/contracts/quota-snapshot.schema.json";
import type { Snapshot } from "../core/types.ts";

const ajv = new Ajv2020();
addFormats(ajv, ["date-time"]);

export const validateSnapshot = ajv.compile<Snapshot>(schema);
