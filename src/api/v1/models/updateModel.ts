import mongoose from 'mongoose';

export type UpdateType = {
  _id: string;
  updated: Date;
};

const Schema = mongoose.Schema;

const updateSchema = new Schema<UpdateType>({
  _id: { type: String, required: true },
  updated: { type: Date, required: true },
});

export default mongoose.model<UpdateType>('Updates', updateSchema);
