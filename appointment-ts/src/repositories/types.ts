import type { Types } from "mongoose";

/** Anything mongoose will happily treat as an _id. */
export type Id = string | Types.ObjectId;
