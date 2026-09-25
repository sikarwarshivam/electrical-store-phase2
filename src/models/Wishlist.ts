import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWishlistItem extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlistItem>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  },
  { timestamps: true }
);

WishlistSchema.index({ user: 1, product: 1 }, { unique: true });
WishlistSchema.index({ user: 1, createdAt: -1 });

export const Wishlist: Model<IWishlistItem> =
  mongoose.models.Wishlist ||
  mongoose.model<IWishlistItem>("Wishlist", WishlistSchema);
