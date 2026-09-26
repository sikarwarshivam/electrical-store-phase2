import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDeliveryDistanceSlab {
  fromKm: number;
  toKm: number;
  feePaise: number;
}

export interface IStoreSettings extends Document {
  key: "default";
  delivery: {
    model: "SELF_AND_COURIER";
    selfDelivery: {
      freeAboveOrderValuePaise: number;
      distanceSlabs: IDeliveryDistanceSlab[];
    };
    courier: {
      pricingMode: "MANUAL_CONFIGURATION";
      flatFeePaise: number;
    };
    cod: {
      enabled: boolean;
      minOrderValuePaise: number;
      maxOrderValuePaise: number;
      convenienceFeePaise: number;
    };
    serviceability: {
      selfDeliveryPincodes: string[];
      courierPincodes: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryDistanceSlabSchema = new Schema<IDeliveryDistanceSlab>(
  {
    fromKm: { type: Number, required: true, min: 0, max: 1000 },
    toKm: { type: Number, required: true, min: 0, max: 1000 },
    feePaise: {
      type: Number,
      required: true,
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
    },
  },
  { _id: false }
);

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    key: {
      type: String,
      enum: ["default"],
      unique: true,
      required: true,
      default: "default",
    },
    delivery: {
      model: {
        type: String,
        enum: ["SELF_AND_COURIER"],
        required: true,
        default: "SELF_AND_COURIER",
      },
      selfDelivery: {
        freeAboveOrderValuePaise: {
          type: Number,
          required: true,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          default: 100000,
        },
        distanceSlabs: {
          type: [DeliveryDistanceSlabSchema],
          required: true,
          default: [
            { fromKm: 0, toKm: 3, feePaise: 3000 },
            { fromKm: 3, toKm: 7, feePaise: 5000 },
            { fromKm: 7, toKm: 10, feePaise: 8000 },
          ],
        },
      },
      courier: {
        pricingMode: {
          type: String,
          enum: ["MANUAL_CONFIGURATION"],
          required: true,
          default: "MANUAL_CONFIGURATION",
        },
        flatFeePaise: {
          type: Number,
          required: true,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          default: 10000,
        },
      },
      cod: {
        enabled: { type: Boolean, required: true, default: false },
        minOrderValuePaise: {
          type: Number,
          required: true,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          default: 0,
        },
        maxOrderValuePaise: {
          type: Number,
          required: true,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          default: 0,
        },
        convenienceFeePaise: {
          type: Number,
          required: true,
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          default: 0,
        },
      },
      serviceability: {
        selfDeliveryPincodes: {
          type: [String],
          required: true,
          default: [],
        },
        courierPincodes: {
          type: [String],
          required: true,
          default: [],
        },
      },
    },
  },
  { timestamps: true }
);

export const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema);

export const DEFAULT_STORE_SETTINGS = {
  key: "default" as const,
  delivery: {
    model: "SELF_AND_COURIER" as const,
    selfDelivery: {
      freeAboveOrderValuePaise: 100000,
      distanceSlabs: [
        { fromKm: 0, toKm: 3, feePaise: 3000 },
        { fromKm: 3, toKm: 7, feePaise: 5000 },
        { fromKm: 7, toKm: 10, feePaise: 8000 },
      ],
    },
    courier: {
      pricingMode: "MANUAL_CONFIGURATION" as const,
      flatFeePaise: 10000,
    },
    cod: {
      enabled: false,
      minOrderValuePaise: 0,
      maxOrderValuePaise: 0,
      convenienceFeePaise: 0,
    },
    serviceability: {
      selfDeliveryPincodes: [],
      courierPincodes: [],
    },
  },
};
